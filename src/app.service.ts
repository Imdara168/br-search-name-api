import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { message: string } {
    return { message: 'NestJS API is running' };
  }

  getHealth(): { status: string; uptime: number } {
    return {
      status: 'ok',
      uptime: process.uptime(),
    };
  }
}
