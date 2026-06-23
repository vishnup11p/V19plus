import { Worker, Job } from 'bullmq';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';
import { logger } from '../../utils/logger';
import prisma from '../../config/db';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const redisUrl = process.env.REDIS_URL?.startsWith('redis://') ? process.env.REDIS_URL : 'redis://127.0.0.1:6379';
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const OUTPUT_DIR = path.join(__dirname, '../../../uploads/hls');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

export const videoWorker = new Worker('video-transcode', async (job: Job) => {
  const { filePath, contentId, episodeId } = job.data;
  const folderName = episodeId ? `${contentId}_${episodeId}` : contentId;
  const outputFolder = path.join(OUTPUT_DIR, folderName);

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  const masterPlaylistPath = path.join(outputFolder, 'master.m3u8');
  logger.info(`Starting transcoding for job ${job.id}: ${folderName}`);

  return new Promise((resolve, reject) => {
    // Generate an HLS stream (simplified 720p version for demo/speed)
    ffmpeg(filePath)
      .outputOptions([
        '-profile:v main',
        '-vf scale=w=1280:h=720:force_original_aspect_ratio=decrease',
        '-c:a aac',
        '-ar 48000',
        '-b:a 128k',
        '-c:v h264',
        '-crf 20',
        '-g 48',
        '-keyint_min 48',
        '-sc_threshold 0',
        '-b:v 2500k',
        '-maxrate 2675k',
        '-bufsize 3750k',
        '-hls_time 10',
        '-hls_playlist_type vod',
        '-hls_segment_filename', path.join(outputFolder, '720p_%03d.ts')
      ])
      .output(masterPlaylistPath)
      .on('end', async () => {
        logger.info(`Transcoding complete for job ${job.id}`);
        const videoUrl = `/uploads/hls/${folderName}/master.m3u8`;

        if (episodeId) {
          await prisma.episode.update({
            where: { id: episodeId },
            data: { videoUrl },
          });
        } else {
          await prisma.content.update({
            where: { id: contentId },
            data: { videoUrl },
          });
        }

        resolve({ videoUrl });
      })
      .on('error', (err) => {
        logger.error(`Error transcoding job ${job.id}:`, err);
        reject(err);
      })
      .run();
  });
}, { connection, concurrency: 1 });

videoWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed with error ${err.message}`);
});
