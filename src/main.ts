import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters';
import { ApiResponseInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
