import { PublicResolverError } from '../errors';
import { parseCredentialInput } from '../schemas';

export type StoredCredentialV1 = {
  schemaVersion: 1;
  accessKeyId: string;
  secretAccessKey: string;
  updatedAt: string;
};

export type CredentialRepository = {
  read(): Promise<StoredCredentialV1 | undefined>;
  write(credential: StoredCredentialV1): Promise<void>;
  delete(): Promise<void>;
};

export const CREDENTIAL_SECRET_KEY = 'aws.credentials.v1';

export type SecretStore = {
  getSecret(key: string): Promise<unknown>;
  setSecret(key: string, value: unknown): Promise<void>;
  deleteSecret(key: string): Promise<void>;
};

const parseStoredCredential = (value: unknown): StoredCredentialV1 => {
  try {
    const firstDecode = typeof value === 'string' ? JSON.parse(value) : value;
    const stored = typeof firstDecode === 'string' ? JSON.parse(firstDecode) : firstDecode;
    if (
      typeof stored !== 'object' ||
      stored === null ||
      Array.isArray(stored) ||
      Reflect.get(stored, 'schemaVersion') !== 1
    ) {
      throw new PublicResolverError('INTERNAL_ERROR', true, 'credential-record-shape');
    }
    const credential = parseCredentialInput({
      accessKeyId: Reflect.get(stored, 'accessKeyId'),
      secretAccessKey: Reflect.get(stored, 'secretAccessKey'),
    });
    const updatedAt = Reflect.get(stored, 'updatedAt');
    if (
      typeof updatedAt !== 'string' ||
      Number.isNaN(Date.parse(updatedAt)) ||
      new Date(updatedAt).toISOString() !== updatedAt
    ) {
      throw new PublicResolverError('INTERNAL_ERROR', true, 'credential-timestamp');
    }
    return { schemaVersion: 1, ...credential, updatedAt };
  } catch (error) {
    if (error instanceof PublicResolverError) throw error;
    throw new PublicResolverError('INTERNAL_ERROR', true, 'credential-record-decode');
  }
};

export const createKvsCredentialRepository = (
  secretStore: SecretStore,
): CredentialRepository => ({
  read: async () => {
    const value = await secretStore.getSecret(CREDENTIAL_SECRET_KEY);
    return value === undefined ? undefined : parseStoredCredential(value);
  },
  write: (credential) => secretStore.setSecret(CREDENTIAL_SECRET_KEY, JSON.stringify(credential)),
  delete: () => secretStore.deleteSecret(CREDENTIAL_SECRET_KEY),
});
