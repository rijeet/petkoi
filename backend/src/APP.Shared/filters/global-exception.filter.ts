import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '@APP.Shared/exceptions/domain.exception';
import { SystemException } from '@APP.Shared/exceptions/system.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Domain / user-facing errors
    if (exception instanceof DomainException) {
      const status = exception.statusCode ?? HttpStatus.BAD_REQUEST;
      return response.status(status).json({
        statusCode: status,
        message: exception.message,
        code: exception.code,
        path: request.url,
        timestamp: new Date().toISOString(),
        details: exception.details,
      });
    }

    // Standard Nest HttpExceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as any;
      const message =
        typeof res === 'string'
          ? res
          : Array.isArray(res?.message)
            ? res.message.join(', ')
            : res?.message || exception.message;
      return response.status(status).json({
        statusCode: status,
        message,
        code: res?.code,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    // System / unexpected errors
    if (exception instanceof SystemException) {
      const status = exception.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
      // Log details server-side, but only return safe message
      // eslint-disable-next-line no-console
      console.error('SystemException', exception);
      return response.status(status).json({
        statusCode: status,
        message: 'Internal server error',
        code: exception.code ?? 'SYSTEM_ERROR',
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    // Unknown errors
    // eslint-disable-next-line no-console
    console.error('Unhandled exception', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

