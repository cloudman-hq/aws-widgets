import type { PublicErrorCode } from '../shared/contracts.js';

export class PublicResolverError extends Error {
  readonly code: PublicErrorCode;
  readonly retryable: boolean;

  constructor(code: PublicErrorCode, retryable = false) {
    super(code);
    this.name = 'PublicResolverError';
    this.code = code;
    this.retryable = retryable;
  }
}
