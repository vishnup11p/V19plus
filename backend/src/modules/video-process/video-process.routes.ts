import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadVideo } from './video-process.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

const UPLOADS_DIR = path.join(__dirname, '../../../uploads/raw');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2000 * 1024 * 1024 } // 2GB limit
});

router.post('/upload', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), upload.single('video'), uploadVideo);

export default router;
