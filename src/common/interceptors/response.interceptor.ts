import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

type ApiResponse<T> = {
  success: true;
  data: T;
  timestamp: string;
  path: string;
};

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data: T) => {
        if (data === undefined || data === null) {
          return data as unknown as ApiResponse<T>;
        }
        if (
          data instanceof Buffer ||
          typeof (data as unknown as { pipe: unknown }).pipe === 'function'
        ) {
          return data as unknown as ApiResponse<T>;
        }
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
