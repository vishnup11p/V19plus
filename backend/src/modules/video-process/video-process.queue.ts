import { Queue } from 'bullmq';
import { logger } from '../../utils/logger';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL?.startsWith('redis://') ? process.env.REDIS_URL : 'redis://127.0.0.1:6379';
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

export const videoQueue = new Queue('video-transcode', { connection });

export async function addVideoToQueue(jobId: string, filePath: string, contentId: string, episodeId?: string) {
  logger.info(`Adding video ${jobId} to transcode queue`);
  await videoQueue.add('transcode', {
    filePath,
    contentId,
    episodeId,
  }, { jobId });
}
