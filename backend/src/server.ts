import http from 'http';
import { app } from './app';
import { config } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { initSocketServer } from './sockets/socket.server';

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Create HTTP Server
    const server = http.createServer(app);

    // 3. Initialize Real-Time WebSockets
    initSocketServer(server);

    // 4. Start Listening
    server.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(`🚀 SaaS Backend running on http://localhost:${config.port}`);
      console.log(`⚡ Environment: ${config.nodeEnv}`);
      console.log(`📡 Client URL: ${config.clientUrl}`);
      console.log(`===============================================`);
    });

    // Graceful Shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Closed remaining connections.');
        process.exit(0);
      });

      // Force exit after 10s if stuck
      setTimeout(() => {
        console.error('[Server] Forcefully terminating after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
