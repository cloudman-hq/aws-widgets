import { describe, expect, it, vi } from 'vitest';
import {
  CREDENTIAL_SECRET_KEY,
  createKvsCredentialRepository,
  type StoredCredentialV1,
} from '../src/resolver/credentials/repository.js';

const STORED: StoredCredentialV1 = {
  schemaVersion: 1,
  accessKeyId: 'FAKEACCESSKEY0001',
  secretAccessKey: 'fake-secret-access-key-that-is-never-returned',
  updatedAt: '2026-08-28T00:00:00.000Z',
};

describe('Forge secret credential repository', () => {
  it('uses only the one installation-scoped secret key', async () => {
    const secretStore = {
      getSecret: vi.fn(async () => STORED),
      setSecret: vi.fn(async () => undefined),
      deleteSecret: vi.fn(async () => undefined),
    };
    const repository = createKvsCredentialRepository(secretStore);

    await expect(repository.read()).resolves.toEqual(STORED);
    await repository.write(STORED);
    await repository.delete();

    expect(CREDENTIAL_SECRET_KEY).toBe('aws.credentials.v1');
    expect(secretStore.getSecret).toHaveBeenCalledWith(CREDENTIAL_SECRET_KEY);
    expect(secretStore.setSecret).toHaveBeenCalledWith(CREDENTIAL_SECRET_KEY, STORED);
    expect(secretStore.deleteSecret).toHaveBeenCalledWith(CREDENTIAL_SECRET_KEY);
  });

  it('fails closed when the secret record is malformed', async () => {
    const secretStore = {
      getSecret: vi.fn(async () => ({
        ...STORED,
        updatedAt: STORED.secretAccessKey,
        unexpected: 'field',
      })),
      setSecret: vi.fn(async () => undefined),
      deleteSecret: vi.fn(async () => undefined),
    };
    const repository = createKvsCredentialRepository(secretStore);

    await expect(repository.read()).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'INTERNAL_ERROR',
    });
  });
});
