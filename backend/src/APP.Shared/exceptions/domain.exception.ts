import { HttpStatus } from '@nestjs/common';

/**
 * DomainException represents user-facing errors (validation, auth, throttling, etc.)
 * that should return a controlled HTTP status and message to the client.
 */
export class DomainException extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly details?: any;

  constructor(message: string, statusCode: number = HttpStatus.BAD_REQUEST, code?: string, details?: any) {
    super(message);
    this.name = 'DomainException';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

