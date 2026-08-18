import { Controller, Post, UseInterceptors, UploadedFile, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoProcessService } from './video-process.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Controller('video-process')
export class VideoProcessController {
  constructor(private readonly videoProcessService: VideoProcessService) {}

  @Post('upload')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          callback(null, file.fieldname + '-' + uniqueSuffix + ext);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(mp4|mkv|avi|mov)$/)) {
          return callback(new BadRequestException('Only video files (mp4, mkv, avi, mov) are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('contentId') contentId: string,
    @Body('episodeId') episodeId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }
    if (!contentId) {
      // Clean up uploaded temp file
      fs.unlinkSync(file.path);
      throw new BadRequestException('Content ID is required');
    }

    // Trigger transcoding in background
    const videoUrl = await this.videoProcessService.transcodeHls(
      file.path,
      contentId,
      !!episodeId,
      episodeId,
    );

    return {
      message: 'Transcoding started in background',
      videoUrl,
    };
  }
}
