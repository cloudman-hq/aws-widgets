import { describe, expect, it, vi } from 'vitest';
import { createResolverHandlers } from '../src/resolver/handlers.js';
import type { StoredCredentialV1 } from '../src/resolver/credentials/repository.js';

const CREDENTIAL: StoredCredentialV1 = {
  schemaVersion: 1,
  accessKeyId: 'FAKEACCESSKEY0001',
  secretAccessKey: 'fake-secret-access-key-that-is-never-returned',
  updatedAt: '2026-08-28T00:00:00.000Z',
};

const request = (payload: unknown, moduleKey = 'aws-widget-macro') => ({
  payload,
  context: { accountId: 'account-1', moduleKey },
});

describe('resource resolver operations', () => {
  it('resolves an existing Connect macro configuration from its preserved uuid and page', async () => {
    const resolveLegacyMacroConfig = vi.fn(async () => ({
      schemaVersion: 1 as const,
      region: 'us-east-1' as const,
      resourceType: 'ec2' as const,
      resourceId: 'i-0123456789abcdef0',
    }));
    const handlers = createResolverHandlers({
      repository: { read: vi.fn(), write: vi.fn(), delete: vi.fn() },
      validateWithAws: vi.fn(),
      now: () => new Date(),
      createRequestId: () => 'legacy-config-request',
      log: vi.fn(),
      resolveLegacyMacroConfig,
    });

    const result = await handlers['macro.config.resolve']({
      payload: {},
      context: {
        accountId: 'account-1',
        moduleKey: 'aws-widget-macro',
        extension: {
          config: { uuid: 'saved-connect-uuid' },
          content: { id: '12345' },
        },
      },
    });

    expect(resolveLegacyMacroConfig).toHaveBeenCalledWith({
      contentId: '12345',
      uuid: 'saved-connect-uuid',
    });
    expect(result).toEqual({
      ok: true,
      data: {
        config: {
          schemaVersion: 1,
          region: 'us-east-1',
          resourceType: 'ec2',
          resourceId: 'i-0123456789abcdef0',
        },
        source: 'connect',
      },
      requestId: 'legacy-config-request',
    });
  });

  it('reads the credential backend-side and returns a safe normalized list envelope', async () => {
    const dispose = vi.fn();
    const handlers = createResolverHandlers({
      repository: { read: async () => CREDENTIAL, write: vi.fn(), delete: vi.fn() },
      validateWithAws: vi.fn(),
      now: () => new Date(),
      createRequestId: () => 'resource-request-1',
      log: vi.fn(),
      createResourceAdapter: (_type, _region, credential) => {
        expect(credential).toBe(CREDENTIAL);
        return {
          list: async () => ({ items: [{ id: 'i-1', label: '10.0.0.1' }], truncated: false }),
          describe: vi.fn(),
          dispose,
        };
      },
    });
    const result = await handlers['resource.list'](request({ region: 'us-east-1', resourceType: 'ec2' }));
    expect(result).toEqual({
      ok: true,
      data: { items: [{ id: 'i-1', label: '10.0.0.1' }], truncated: false },
      requestId: 'resource-request-1',
    });
    expect(JSON.stringify(result)).not.toContain(CREDENTIAL.secretAccessKey);
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('rejects the wrong surface before storage and returns NOT_CONFIGURED safely', async () => {
    const read = vi.fn(async () => undefined);
    const handlers = createResolverHandlers({
      repository: { read, write: vi.fn(), delete: vi.fn() },
      validateWithAws: vi.fn(),
      now: () => new Date(),
      createRequestId: () => 'resource-request-2',
      log: vi.fn(),
    });
    const payload = {
      schemaVersion: 1,
      region: 'us-east-1',
      resourceType: 'ec2',
      resourceId: 'i-00000000000000001',
    };
    await expect(handlers['resource.describe'](request(payload, 'aws-widgets-settings'))).resolves.toMatchObject({
      ok: false, error: { code: 'UNAUTHORIZED' },
    });
    expect(read).not.toHaveBeenCalled();
    await expect(handlers['resource.describe'](request(payload))).resolves.toMatchObject({
      ok: false, error: { code: 'NOT_CONFIGURED' },
    });
  });
});
