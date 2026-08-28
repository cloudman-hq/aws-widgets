import { PublicResolverError } from '../errors.js';

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

export const mapAwsError = (error: unknown): PublicResolverError => {
  const name =
    typeof error === 'object' && error !== null && typeof Reflect.get(error, 'name') === 'string'
      ? (Reflect.get(error, 'name') as string)
      : '';

  if (AUTH_ERROR_NAMES.has(name)) return new PublicResolverError('INVALID_AUTH');
  if (THROTTLE_ERROR_NAMES.has(name)) return new PublicResolverError('THROTTLED', true);
  if (name === 'AbortError' || name === 'TimeoutError') {
    return new PublicResolverError('NETWORK_ERROR', true);
  }
  if (name === 'AccessDenied' || name === 'AccessDeniedException') {
    return new PublicResolverError('PERMISSION_DENIED');
  }
  return new PublicResolverError('INTERNAL_ERROR', true);
};
