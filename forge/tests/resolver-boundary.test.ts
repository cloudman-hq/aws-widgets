import { describe, expect, it, vi } from 'vitest';
import { createResolverHandlers } from '../src/resolver/handlers.js';
import type { StoredCredentialV1 } from '../src/resolver/credentials/repository.js';

const STORED: StoredCredentialV1 = {
  schemaVersion: 1,
  accessKeyId: 'FAKEACCESSKEY0001',
  secretAccessKey: 'fake-secret-access-key-that-is-never-returned',
  updatedAt: '2026-08-28T00:00:00.000Z',
};

describe('public resolver boundary', () => {
  it('wraps credential status in the approved safe envelope', async () => {
    const handlers = createResolverHandlers({
      repository: {
        read: async () => STORED,
        write: async () => undefined,
        delete: async () => undefined,
      },
      validateWithAws: async () => undefined,
      now: () => new Date('2026-08-28T00:00:00.000Z'),
      createRequestId: () => 'request-safe-1',
      log: () => undefined,
    });

    const result = await handlers['credentials.status']({
      payload: {},
      context: { accountId: 'account-1', moduleKey: 'aws-widgets-settings' },
    });

    expect(result).toEqual({
      ok: true,
      data: { configured: true, updatedAt: STORED.updatedAt },
      requestId: 'request-safe-1',
    });
    expect(JSON.stringify(result)).not.toContain(STORED.secretAccessKey);
  });

  it('rejects credential operations outside authenticated global settings', async () => {
    const read = vi.fn(async () => STORED);
    const handlers = createResolverHandlers({
      repository: {
        read,
        write: async () => undefined,
        delete: async () => undefined,
      },
      validateWithAws: async () => undefined,
      now: () => new Date('2026-08-28T00:00:00.000Z'),
      createRequestId: () => 'request-unauthorized-1',
      log: () => undefined,
    });

    const result = await handlers['credentials.status']({
      payload: {},
      context: { accountId: 'account-1', moduleKey: 'aws-widgets-resource' },
    });

    expect(result).toEqual({
      ok: false,
      error: { code: 'UNAUTHORIZED', retryable: false },
      requestId: 'request-unauthorized-1',
    });
    expect(read).not.toHaveBeenCalled();
  });

  it('redacts raw failures from both response and structured logs', async () => {
    const rawFailure = new Error(
      `AWS request failed ${STORED.accessKeyId} ${STORED.secretAccessKey} requestId=aws-raw-1`,
    );
    const log = vi.fn();
    const handlers = createResolverHandlers({
      repository: {
        read: async () => {
          throw rawFailure;
        },
        write: async () => undefined,
        delete: async () => undefined,
      },
      validateWithAws: async () => undefined,
      now: () => new Date('2026-08-28T00:00:00.000Z'),
      createRequestId: () => 'request-redacted-1',
      log,
    });

    const result = await handlers['credentials.status']({
      payload: {},
      context: { accountId: 'account-1', moduleKey: 'aws-widgets-settings' },
    });
    const serialized = JSON.stringify({ result, logs: log.mock.calls });

    expect(result).toEqual({
      ok: false,
      error: { code: 'INTERNAL_ERROR', retryable: true },
      requestId: 'request-redacted-1',
    });
    expect(serialized).not.toContain(rawFailure.message);
    expect(serialized).not.toContain(STORED.accessKeyId);
    expect(serialized).not.toContain(STORED.secretAccessKey);
    expect(serialized).not.toContain('aws-raw-1');
  });
});
