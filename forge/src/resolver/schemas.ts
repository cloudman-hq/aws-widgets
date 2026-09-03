import { PublicResolverError } from './errors';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export type CredentialInput = {
  accessKeyId: string;
  secretAccessKey: string;
};

const CREDENTIAL_FIELDS = new Set(['accessKeyId', 'secretAccessKey']);
const PRINTABLE_NON_WHITESPACE = /^[!-~]+$/;

const parseCredentialField = (
  value: unknown,
  minimumLength: number,
  maximumLength: number,
): string => {
  if (typeof value !== 'string') {
    throw new PublicResolverError('INVALID_INPUT');
  }

  const parsed = value.trim();
  if (
    parsed.length < minimumLength ||
    parsed.length > maximumLength ||
    !PRINTABLE_NON_WHITESPACE.test(parsed)
  ) {
    throw new PublicResolverError('INVALID_INPUT');
  }

  return parsed;
};

export const parseEmptyPayload = (payload: unknown): Record<string, never> => {
  if (!isPlainObject(payload) || Object.keys(payload).length !== 0) {
    throw new PublicResolverError('INVALID_INPUT');
  }

  return {};
};

export const parseCredentialInput = (payload: unknown): CredentialInput => {
  if (
    !isPlainObject(payload) ||
    Object.keys(payload).some((field) => !CREDENTIAL_FIELDS.has(field))
  ) {
    throw new PublicResolverError('INVALID_INPUT');
  }

  const accessKeyId = parseCredentialField(payload.accessKeyId, 16, 128);
  const secretAccessKey = parseCredentialField(payload.secretAccessKey, 32, 256);
  return { accessKeyId, secretAccessKey };
};
