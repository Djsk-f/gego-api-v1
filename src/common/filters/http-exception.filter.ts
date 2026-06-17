import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} — ${status} — ${this.getMessage(exceptionResponse, exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: this.getMessage(exceptionResponse, exception),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getMessage(
    exceptionResponse: string | object | null,
    exception: unknown,
  ) {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (exceptionResponse && 'message' in exceptionResponse) {
      const msg = exceptionResponse.message;
      return Array.isArray(msg) ? msg.join('; ') : msg;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'Internal server error';
  }
}
