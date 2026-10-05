import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app: Application = express();

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
    })
  );

  // Body Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads directory for task attachments
  app.use('/uploads', express.static(config.uploadDir));

  // Mount API Routes
  app.use('/api', apiRoutes);

  // 404 Handler for undefined API routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND',
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
