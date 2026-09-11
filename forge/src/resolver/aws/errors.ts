import { PublicResolverError } from '../errors';
import { PUBLIC_ERROR_CODES, type PublicErrorCode } from '../../shared/contracts';

const AUTH_ERROR_NAMES = new Set([
  'ExpiredToken',
  'ExpiredTokenException',
  'InvalidClientTokenId',
  'InvalidSignatureException',
  'SignatureDoesNotMatch',
  'UnrecognizedClientException',
]);

const THROTTLE_ERROR_NAMES = new Set([
  'Throttling',
  'ThrottlingException',
  'TooManyRequestsException',
]);

const NOT_FOUND_ERROR_NAMES = new Set([
  'NoSuchBucket',
  'ResourceNotFoundException',
  'InvalidInstanceID.NotFound',
  'ClusterNotFoundException',
]);

const PERMISSION_ERROR_NAMES = new Set([
  'AccessDenied',
  'AccessDeniedException',
  'UnauthorizedOperation',
]);

const NETWORK_ERROR_NAMES = new Set([
  'AbortError',
  'TimeoutError',
  'NetworkingError',
  'RequestTimeout',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
]);

const safeDiagnostic = (value: string): string | undefined =>
  /^[A-Za-z0-9_.-]{1,80}$/.test(value) ? value : undefined;

export const mapAwsError = (error: unknown): PublicResolverError => {
  if (error instanceof PublicResolverError) return error;
  if (typeof error === 'object' && error !== null) {
    const publicCode = Reflect.get(error, 'code');
    const retryable = Reflect.get(error, 'retryable');
    if (
      typeof publicCode === 'string'
      && PUBLIC_ERROR_CODES.includes(publicCode as PublicErrorCode)
    ) {
      return new PublicResolverError(publicCode as PublicErrorCode, retryable === true);
    }
  }
  const name =
    typeof error === 'object' && error !== null && typeof Reflect.get(error, 'name') === 'string'
      ? (Reflect.get(error, 'name') as string)
      : '';

  const code =
    typeof error === 'object' && error !== null && typeof Reflect.get(error, 'code') === 'string'
      ? (Reflect.get(error, 'code') as string)
      : '';

  if (AUTH_ERROR_NAMES.has(name) || AUTH_ERROR_NAMES.has(code)) {
    return new PublicResolverError('INVALID_AUTH');
  }
  if (NOT_FOUND_ERROR_NAMES.has(name) || NOT_FOUND_ERROR_NAMES.has(code)) {
    return new PublicResolverError('NOT_FOUND');
  }
  if (THROTTLE_ERROR_NAMES.has(name)) return new PublicResolverError('THROTTLED', true);
  if (THROTTLE_ERROR_NAMES.has(code)) return new PublicResolverError('THROTTLED', true);
  if (NETWORK_ERROR_NAMES.has(name) || NETWORK_ERROR_NAMES.has(code)) {
    return new PublicResolverError('NETWORK_ERROR', true);
  }
  if (PERMISSION_ERROR_NAMES.has(name) || PERMISSION_ERROR_NAMES.has(code)) {
    return new PublicResolverError('PERMISSION_DENIED');
  }
  return new PublicResolverError('INTERNAL_ERROR', true, safeDiagnostic(name) ?? safeDiagnostic(code));
};
