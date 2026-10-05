import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authService } from '../services/auth.service';
import { AppResponse } from '../utils/apiResponse';

export class AuthController {
  async register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      AppResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.getCurrentUser(req.user!.id);
      AppResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
