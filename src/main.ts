import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters';
import { ApiResponseInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: [
      /^http:\/\/localhost:\d+$/, 
      /^http:\/\/127\.0\.0\.1:\d+$/, 
      'https://pbl7-medicine.vercel.app/'
    ],
  });
//   app.enableCors({
//   origin: '*', // CHO PHÉP TẤT CẢ - Cách nhanh nhất để qua môn
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//   allowedHeaders: 'Content-Type,Accept,Authorization',
//   credentials: true,
// });


  // Enable validation for DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Register ClassSerializerInterceptor to handle @Exclude decorators
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get('Reflector')));

  // Register global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Register global response interceptor
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  // Serve uploaded files from /uploads via /uploads/*
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
