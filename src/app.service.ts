import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to Medicine E-Commerce API';
  }

  getHealth() {
    return {
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date(),
    };
  }
}
