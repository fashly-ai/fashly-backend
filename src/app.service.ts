import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Authentication API is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: {
        auth: '/auth',
        docs: '/api/docs',
      },
    };
  }

  getHealth(): object {
    const memUsage = process.memoryUsage();
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
      },
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    };
  }
}
