// S3 configuration placeholder - configure with real AWS credentials for production
import { logger } from '../utils/logger';

export const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET || 'v19plus-assets',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
};

// In production, use @aws-sdk/client-s3
// For local dev, thumbnails/videos are served from static assets
export function getUploadUrl(key: string): string {
  if (process.env.NODE_ENV === 'production' && s3Config.accessKeyId) {
    return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
  }
  return `/uploads/${key}`;
}

logger.info('📦 S3 config loaded (placeholder for local dev)');
