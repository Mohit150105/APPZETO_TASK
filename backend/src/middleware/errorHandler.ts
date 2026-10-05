import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { config } from '../config/env';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Operational custom errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    res.status(422).json({
      success: false,
      message: `Validation failed: ${issues}`,
      code: 'VALIDATION_ERROR',
      errors: err.issues,
    });
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: `Invalid format for field '${err.path}': ${err.value}`,
      code: 'INVALID_ID',
    });
    return;
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'record';
    res.status(409).json({
      success: false,
      message: `A resource with this ${field} already exists`,
      code: 'DUPLICATE_RESOURCE',
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
      code: 'TOKEN_INVALID',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Authorization token has expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      code: 'FILE_UPLOAD_ERROR',
    });
    return;
  }

  // Unhandled / server errors
  console.error('[Unhandled Server Error]', err);
  const isProduction = config.nodeEnv === 'production';

  res.status(500).json({
    success: false,
    message: isProduction ? 'An unexpected internal error occurred' : err.message || 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR',
    ...(!isProduction && { stack: err.stack }),
  });
};
