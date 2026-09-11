import type { PublicErrorCode } from '../shared/contracts';

export class PublicResolverError extends Error {
  readonly code: PublicErrorCode;
  readonly retryable: boolean;
  readonly causeName?: string;

  constructor(code: PublicErrorCode, retryable = false, causeName?: string) {
    super(code);
    this.name = 'PublicResolverError';
    this.code = code;
    this.retryable = retryable;
    if (causeName) this.causeName = causeName;
  }
}
