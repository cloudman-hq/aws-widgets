import { describe, expect, it } from 'vitest';
import { createCredentialOperations } from '../src/resolver/credentials/operations.js';
import type { StoredCredentialV1 } from '../src/resolver/credentials/repository.js';

const STORED: StoredCredentialV1 = {
  schemaVersion: 1,
  accessKeyId: 'FAKEACCESSKEY0001',
  secretAccessKey: 'fake-secret-access-key-that-is-never-returned',
  sessionToken: 'fake-session-token-that-is-never-returned',
  updatedAt: '2026-08-28T00:00:00.000Z',
};

describe('credential resolver operations', () => {
  it('returns status without returning any stored credential material', async () => {
    const operations = createCredentialOperations({
      repository: {
        read: async () => STORED,
        write: async () => undefined,
        delete: async () => undefined,
      },
      validateWithAws: async () => undefined,
      now: () => new Date('2026-08-28T00:00:00.000Z'),
    });

    const result = await operations.status({});

    expect(result).toEqual({
      configured: true,
      updatedAt: '2026-08-28T00:00:00.000Z',
    });
    expect(JSON.stringify(result)).not.toContain(STORED.accessKeyId);
    expect(JSON.stringify(result)).not.toContain(STORED.secretAccessKey);
    expect(JSON.stringify(result)).not.toContain(STORED.sessionToken);
  });

  it('deletes idempotently and returns only the unconfigured status', async () => {
    let deleteCalls = 0;
    const operations = createCredentialOperations({
      repository: {
        read: async () => STORED,
        write: async () => undefined,
        delete: async () => {
          deleteCalls += 1;
        },
      },
      validateWithAws: async () => undefined,
      now: () => new Date('2026-08-28T00:00:00.000Z'),
    });

    const first = await operations.delete({});
    const second = await operations.delete({});

    expect(deleteCalls).toBe(2);
    expect(first).toEqual({ configured: false });
    expect(second).toEqual({ configured: false });
    expect(JSON.stringify([first, second])).not.toContain(STORED.secretAccessKey);
  });

  it('rejects unexpected status payload fields before reading storage', async () => {
    let readCalls = 0;
    const operations = createCredentialOperations({
      repository: {
        read: async () => {
          readCalls += 1;
          return STORED;
        },
        write: async () => undefined,
        delete: async () => undefined,
      },
      validateWithAws: async () => undefined,
      now: () => new Date('2026-08-28T00:00:00.000Z'),
    });

    await expect(operations.status({ exposeSecret: true })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
    expect(readCalls).toBe(0);
  });

  it('validates before saving and returns no credential material', async () => {
    const events: string[] = [];
    let written: StoredCredentialV1 | undefined;
    const operations = createCredentialOperations({
      repository: {
        read: async () => undefined,
        write: async (credential) => {
          events.push('write');
          written = credential;
        },
        delete: async () => undefined,
      },
      validateWithAws: async (credential) => {
        events.push('validate');
        expect(credential).toEqual({
          accessKeyId: STORED.accessKeyId,
          secretAccessKey: STORED.secretAccessKey,
          sessionToken: STORED.sessionToken,
        });
      },
      now: () => new Date('2026-08-28T00:00:00.000Z'),
    });

    const result = await operations.save({
      accessKeyId: STORED.accessKeyId,
      secretAccessKey: STORED.secretAccessKey,
      sessionToken: STORED.sessionToken,
    });

    expect(events).toEqual(['validate', 'write']);
    expect(written).toEqual(STORED);
    expect(result).toEqual({ configured: true, updatedAt: STORED.updatedAt });
    expect(JSON.stringify(result)).not.toContain(STORED.accessKeyId);
    expect(JSON.stringify(result)).not.toContain(STORED.secretAccessKey);
    expect(JSON.stringify(result)).not.toContain(STORED.sessionToken);
  });

  it('rejects malformed or unexpected credential fields before validation or storage', async () => {
    let validateCalls = 0;
    let writeCalls = 0;
    const operations = createCredentialOperations({
      repository: {
        read: async () => undefined,
        write: async () => {
          writeCalls += 1;
        },
        delete: async () => undefined,
      },
      validateWithAws: async () => {
        validateCalls += 1;
      },
      now: () => new Date('2026-08-28T00:00:00.000Z'),
    });

    await expect(
      operations.save({
        accessKeyId: 'too-short',
        secretAccessKey: STORED.secretAccessKey,
        endpoint: 'https://attacker.invalid',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(validateCalls).toBe(0);
    expect(writeCalls).toBe(0);
  });

  it('validates credentials without storing them', async () => {
    let writeCalls = 0;
    const operations = createCredentialOperations({
      repository: {
        read: async () => undefined,
        write: async () => {
          writeCalls += 1;
        },
        delete: async () => undefined,
      },
      validateWithAws: async () => undefined,
      now: () => new Date('2026-08-28T00:00:00.000Z'),
    });

    const result = await operations.validate({
      accessKeyId: STORED.accessKeyId,
      secretAccessKey: STORED.secretAccessKey,
      sessionToken: STORED.sessionToken,
    });

    expect(result).toEqual({ valid: true });
    expect(writeCalls).toBe(0);
    expect(JSON.stringify(result)).not.toContain(STORED.secretAccessKey);
  });
});
