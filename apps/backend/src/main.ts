import { existsSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './global-exception.filter';
import { LoggingInterceptor } from './logging.interceptor';

for (const envPath of [
  join(process.cwd(), '.env'),
  join(process.cwd(), '../../.env'),
  join(__dirname, '../../../.env'),
]) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const DEV_SECRETS = [
  'dev_access_secret_change_in_production',
  'dev_refresh_secret_change_in_production',
  'change_me_access_secret_64chars',
  'change_me_refresh_secret_64chars',
];

function validateProductionSecrets(logger: Logger) {
  if (process.env.NODE_ENV !== 'production') return;

  const accessSecret = process.env.JWT_ACCESS_SECRET || '';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || '';

  if (!accessSecret || DEV_SECRETS.includes(accessSecret)) {
    logger.error('JWT_ACCESS_SECRET must be set to a secure value in production');
    process.exit(1);
  }
  if (!refreshSecret || DEV_SECRETS.includes(refreshSecret)) {
    logger.error('JWT_REFRESH_SECRET must be set to a secure value in production');
    process.exit(1);
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  validateProductionSecrets(logger);

  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(cookieParser());

  const productionOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    process.env.MOBILE_URL,
  ].filter(Boolean) as string[];

  const allowedOrigins = [
    ...productionOrigins,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://localhost',
    'https://localhost',
    'capacitor://localhost',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve the local uploads folder statically for video/manifest direct playback
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`V19+ NestJS API running on port ${port}`);
}

bootstrap();
