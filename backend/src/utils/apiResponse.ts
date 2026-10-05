import { Response } from 'express';
import { ApiResponse } from '../types';

export class AppResponse {
  static success<T>(res: Response, data: T, statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: { page: number; limit: number; total: number; totalPages: number },
    statusCode: number = 200
  ) {
    return res.status(statusCode).json({
      success: true,
      data,
      pagination,
    });
  }

  static error(
    res: Response,
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      code,
    });
  }
}
