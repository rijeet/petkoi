import { HttpStatus } from '@nestjs/common';

/**
 * SystemException represents server-side failures that should not expose
 * internal details to clients. Use for unexpected infrastructure errors.
 */
export class SystemException extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly details?: any;

  constructor(message: string, statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR, code?: string, details?: any) {
    super(message);
    this.name = 'SystemException';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

