import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class VideoProcessService {
  private readonly logger = new Logger(VideoProcessService.name);
  private s3Client: S3Client | null = null;

  constructor(private readonly firebase: FirebaseService) {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      this.logger.log('☁️ S3 Client initialized for video uploads');
    } else {
      this.logger.log('☁️ S3 Client disabled (running in Firebase Storage / local uploads mode)');
    }
  }

  async uploadFileToFirebase(filePath: string, destPath: string): Promise<string> {
    const bucket = this.firebase.storage.bucket();
    const [file] = await bucket.upload(filePath, {
      destination: destPath,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  }

  async uploadFileToS3(filePath: string, s3Key: string): Promise<string> {
    const bucket = process.env.AWS_S3_BUCKET || 'v19plus-assets';
    const region = process.env.AWS_REGION || 'us-east-1';

    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const fileStream = fs.createReadStream(filePath);
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: fileStream,
        ACL: 'public-read',
      }),
    );

    return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
  }

  async transcodeHls(inputFilePath: string, contentId: string, isEpisode = false, episodeId?: string): Promise<string> {
    const uniqueId = episodeId || contentId;
    const outputDir = path.join(process.cwd(), 'uploads', uniqueId);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
    const resolutions = [
      { width: 640, height: 360, name: '360p', bitrate: '800k', maxrate: '856k', bufsize: '1200k' },
      { width: 854, height: 480, name: '480p', bitrate: '1400k', maxrate: '1498k', bufsize: '2100k' },
      { width: 1280, height: 720, name: '720p', bitrate: '2800k', maxrate: '2996k', bufsize: '4200k' },
      { width: 1920, height: 1080, name: '1080p', bitrate: '5000k', maxrate: '5350k', bufsize: '7500k' },
    ];

    // Asynchronously kick off transcoding in the background
    this.runTranscode(inputFilePath, outputDir, masterPlaylistPath, resolutions, uniqueId, isEpisode, contentId)
      .catch((err) => this.logger.error(`Failed to transcode video for ${uniqueId}:`, err));

    // Return the future URL immediately
    if (this.s3Client) {
      const bucket = process.env.AWS_S3_BUCKET || 'v19plus-assets';
      const region = process.env.AWS_REGION || 'us-east-1';
      return `https://${bucket}.s3.${region}.amazonaws.com/uploads/${uniqueId}/master.m3u8`;
    }
    const firebaseBucket = this.firebase.storage.bucket();
    return `https://storage.googleapis.com/${firebaseBucket.name}/uploads/${uniqueId}/master.m3u8`;
  }

  private runTranscode(
    inputPath: string,
    outputDir: string,
    masterPath: string,
    resolutions: Array<any>,
    uniqueId: string,
    isEpisode: boolean,
    contentId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.log(`🎬 Transcoding started for ${uniqueId}`);

      let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n';
      let completedResolutions = 0;

      resolutions.forEach((res) => {
        const resPath = path.join(outputDir, `${res.name}.m3u8`);
        
        ffmpeg(inputPath)
          .outputOptions([
            '-profile:v main',
            `-vf scale=w=${res.width}:h=${res.height}:force_original_aspect_ratio=decrease`,
            '-c:a aac',
            '-ar 48000',
            '-b:a 128k',
            '-c:v h264',
            `-b:v ${res.bitrate}`,
            `-maxrate ${res.maxrate}`,
            `-bufsize ${res.bufsize}`,
            '-hls_time 10',
            '-hls_playlist_type event',
            `-hls_segment_filename ${path.join(outputDir, `${res.name}_%03d.ts`)}`,
          ])
          .output(resPath)
          .on('end', async () => {
            this.logger.log(`✅ Finished transcoding resolution ${res.name} for ${uniqueId}`);
            completedResolutions++;

            masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${res.name === '360p' ? 800000 : res.name === '480p' ? 1400000 : res.name === '720p' ? 2800000 : 5000000},RESOLUTION=${res.width}x${res.height}\n${res.name}.m3u8\n`;

            if (completedResolutions === resolutions.length) {
              fs.writeFileSync(masterPath, masterContent);
              this.logger.log(`🎉 Master playlist created for ${uniqueId}`);

              // Upload output folder (HLS segments)
              if (this.s3Client) {
                try {
                  const files = fs.readdirSync(outputDir);
                  for (const file of files) {
                    const filePath = path.join(outputDir, file);
                    await this.uploadFileToS3(filePath, `uploads/${uniqueId}/${file}`);
                  }
                  this.logger.log(`☁️ Uploaded HLS segments to S3 for ${uniqueId}`);
                } catch (s3Err) {
                  this.logger.error(`S3 uploads failed for ${uniqueId}:`, s3Err);
                }
              } else {
                try {
                  const files = fs.readdirSync(outputDir);
                  for (const file of files) {
                    const filePath = path.join(outputDir, file);
                    await this.uploadFileToFirebase(filePath, `uploads/${uniqueId}/${file}`);
                  }
                  this.logger.log(`🔥 Uploaded HLS segments to Firebase Storage for ${uniqueId}`);
                } catch (fbErr) {
                  this.logger.error(`Firebase Storage uploads failed for ${uniqueId}:`, fbErr);
                }
              }

              // Update the videoUrl in the database
              const videoUrl = this.s3Client
                ? `https://${process.env.AWS_S3_BUCKET || 'v19plus-assets'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/uploads/${uniqueId}/master.m3u8`
                : `https://storage.googleapis.com/${this.firebase.storage.bucket().name}/uploads/${uniqueId}/master.m3u8`;

              try {
                if (isEpisode) {
                  const doc = await this.firebase.firestore.collection('content').doc(contentId).get();
                  if (doc.exists) {
                    const data = doc.data() as any;
                    const seasons = data.seasons || [];
                    for (const season of seasons) {
                      for (const ep of season.episodes) {
                        if (ep.id === uniqueId) {
                          ep.videoUrl = videoUrl;
                        }
                      }
                    }
                    await this.firebase.firestore.collection('content').doc(contentId).update({ seasons });
                  }
                } else {
                  await this.firebase.firestore.collection('content').doc(contentId).update({ videoUrl });
                }
              } catch (e) {
                this.logger.error(`Failed to update videoUrl for ${uniqueId}:`, e);
              }

              resolve();
            }
          })
          .on('error', (err) => {
            this.logger.error(`❌ Transcode error on resolution ${res.name}:`, err);
            reject(err);
          })
          .run();
      });
    });
  }
}

