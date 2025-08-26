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
}
