import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { IApiResponse } from '../interfaces';
import { ErrorCode } from '../constants/error-codes';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const traceId = randomUUID();

    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();

        // If response already has the IApiResponse shape, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Wrap data in IApiResponse format
        const apiResponse: IApiResponse = {
          success: true,
          statusCode: response.statusCode || 200,
          message: 'Success',
          data,
          timestamp: new Date().toISOString(),
          traceId
        };

        return apiResponse;
      }),
    );
  }
}
