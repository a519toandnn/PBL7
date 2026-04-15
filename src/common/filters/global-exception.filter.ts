import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { randomUUID } from 'crypto';
import { IApiResponse, IApiError } from '../interfaces';
import { ErrorCode, ERROR_CODE_MESSAGES } from '../constants/error-codes';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<Response>();
    const traceId = randomUUID();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errors: IApiError[] = [];

    // Handle validation errors (BadRequestException with error details)
    if (exception instanceof BadRequestException) {
      statusCode = HttpStatus.BAD_REQUEST;
      errorCode = ErrorCode.VALIDATION_ERROR;
      const responseBody = exception.getResponse() as any;

      if (Array.isArray(responseBody.message)) {
        // Validation pipe errors
        message = 'Validation failed';
        errors = responseBody.message.map((err: any) => ({
          field: err.property,
          message: Object.values(err.constraints || {}).join(', '),
          code: ErrorCode.VALIDATION_ERROR,
          constraint: err.constraints,
        }));
      } else if (typeof responseBody.message === 'string') {
        message = responseBody.message;
      }
    }
    // Handle other HTTP exceptions
    else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      message = exception.message;
      const responseBody = exception.getResponse() as any;

      // Map HTTP status to error codes
      switch (statusCode) {
        case HttpStatus.UNAUTHORIZED:
          errorCode = ErrorCode.UNAUTHORIZED;
          message = 'Unauthorized';
          break;
        case HttpStatus.FORBIDDEN:
          errorCode = ErrorCode.FORBIDDEN;
          message = 'Forbidden';
          break;
        case HttpStatus.NOT_FOUND:
          errorCode = ErrorCode.NOT_FOUND;
          message = 'Not Found';
          break;
        case HttpStatus.CONFLICT:
          errorCode = ErrorCode.CONFLICT;
          message = 'Conflict';
          break;
        default:
          errorCode = ErrorCode.BAD_REQUEST;
      }

      if (responseBody.message && typeof responseBody.message === 'string') {
        message = responseBody.message;
      }
    }
    // Handle unknown errors
    else if (exception instanceof Error) {
      message = exception.message || 'An unexpected error occurred';
      this.logger.error(exception.stack, 'UnhandledException');
    }

    const apiResponse: IApiResponse = {
      success: false,
      statusCode,
      message,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
      traceId
    };

    response.status(statusCode).json(apiResponse);
  }
}
