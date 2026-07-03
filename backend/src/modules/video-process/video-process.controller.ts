import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/errorHandler';
import { addVideoToQueue } from './video-process.queue';
import { v4 as uuidv4 } from 'uuid';

export const uploadVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('No video file uploaded', 400);
    }

    const { contentId, episodeId } = req.body;
    
    if (!contentId) {
      throw new AppError('contentId is required', 400);
    }

    const jobId = uuidv4();
    const filePath = req.file.path;

    await addVideoToQueue(jobId, filePath, contentId, episodeId);

    res.status(202).json({
      message: 'Video upload successful. Transcoding started.',
      jobId,
      status: 'PROCESSING'
    });
  } catch (error) {
    next(error);
  }
};
