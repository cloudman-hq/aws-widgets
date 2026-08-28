import { PublicResolverError } from '../errors';
import { parseCredentialInput } from '../schemas';

export type StoredCredentialV1 = {
  schemaVersion: 1;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
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
  setSecret(key: string, value: StoredCredentialV1): Promise<void>;
  deleteSecret(key: string): Promise<void>;
};

const STORED_FIELDS = new Set([
  'schemaVersion',
  'accessKeyId',
  'secretAccessKey',
  'sessionToken',
  'updatedAt',
]);

const parseStoredCredential = (value: unknown): StoredCredentialV1 => {
  try {
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value) ||
      Reflect.get(value, 'schemaVersion') !== 1 ||
      Object.keys(value).some((key) => !STORED_FIELDS.has(key))
    ) {
      throw new PublicResolverError('INTERNAL_ERROR', true);
    }
    const sessionToken = Reflect.get(value, 'sessionToken');
    const credential = parseCredentialInput({
      accessKeyId: Reflect.get(value, 'accessKeyId'),
      secretAccessKey: Reflect.get(value, 'secretAccessKey'),
      ...(sessionToken === undefined ? {} : { sessionToken }),
    });
    const updatedAt = Reflect.get(value, 'updatedAt');
    if (
      typeof updatedAt !== 'string' ||
      Number.isNaN(Date.parse(updatedAt)) ||
      new Date(updatedAt).toISOString() !== updatedAt
    ) {
      throw new PublicResolverError('INTERNAL_ERROR', true);
    }
    return { schemaVersion: 1, ...credential, updatedAt };
  } catch {
    throw new PublicResolverError('INTERNAL_ERROR', true);
  }
};

export const createKvsCredentialRepository = (
  secretStore: SecretStore,
): CredentialRepository => ({
  read: async () => {
    const value = await secretStore.getSecret(CREDENTIAL_SECRET_KEY);
    return value === undefined ? undefined : parseStoredCredential(value);
  },
  write: (credential) => secretStore.setSecret(CREDENTIAL_SECRET_KEY, credential),
  delete: () => secretStore.deleteSecret(CREDENTIAL_SECRET_KEY),
});
