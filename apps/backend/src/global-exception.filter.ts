import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Prisma error import fallback
let PrismaClientKnownRequestError: any;
try {
  const prismaRuntime = require('@prisma/client/runtime/library');
  PrismaClientKnownRequestError = prismaRuntime.PrismaClientKnownRequestError;
} catch {
  try {
    const prismaClient = require('@prisma/client');
    PrismaClientKnownRequestError = prismaClient.PrismaClientKnownRequestError;
  } catch {
    PrismaClientKnownRequestError = null;
  }
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    // 1. Handle NestJS HttpExceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody = exception.getResponse() as any;
      
      if (typeof resBody === 'object' && resBody !== null) {
        message = resBody.message || exception.message;
        error = resBody.error || exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    }
    // 2. Handle Prisma Client Known Request Errors
    else if (
      PrismaClientKnownRequestError &&
      exception instanceof PrismaClientKnownRequestError
    ) {
      const prismaError = exception as any;
      this.logger.warn(`Prisma error caught [${prismaError.code}]: ${prismaError.message}`);

      switch (prismaError.code) {
        case 'P2002': { // Unique constraint violation
          status = HttpStatus.CONFLICT;
          const target = prismaError.meta?.target ? ` (${prismaError.meta.target.join(', ')})` : '';
          message = `Resource unique constraint failed${target}`;
          error = 'Conflict';
          break;
        }
        case 'P2025': { // Record not found
          status = HttpStatus.NOT_FOUND;
          message = prismaError.meta?.cause || 'Record not found';
          error = 'Not Found';
          break;
        }
        case 'P2003': { // Foreign key constraint violation
          status = HttpStatus.BAD_REQUEST;
          message = `Foreign key constraint failed on field ${prismaError.meta?.field_name || ''}`;
          error = 'Bad Request';
          break;
        }
        default: {
          status = HttpStatus.BAD_REQUEST;
          message = 'Database operation failed';
          error = 'Bad Request';
          break;
        }
      }
    }
    // 3. Fallback for unhandled native/generic Errors
    else {
      const err = exception as Error;
      this.logger.error(
        `Unhandled exception caught: ${err?.message || exception}`,
        err?.stack,
      );
      
      if (process.env.NODE_ENV !== 'production') {
        message = err?.message || String(exception);
        error = err?.name || 'Error';
      }
    }

    // Clean validation messages array (flatten if nested)
    if (Array.isArray(message)) {
      message = message.map((m) => String(m));
    }

    const payload = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(payload);
  }
}
