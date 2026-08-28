import { describe, expect, it, vi } from 'vitest';
import { createLegacyMacroConfigReader } from '../src/resolver/migration/legacy-macro-config.js';
import { decryptLegacyCredential } from '../src/resolver/migration/legacy-credentials.js';
import { createMigratingCredentialRepository } from '../src/resolver/migration/migrating-credential-repository.js';
import type { StoredCredentialV1 } from '../src/resolver/credentials/repository.js';

describe('legacy Connect macro migration', () => {
  it('loads the old content property and normalizes the saved Connect resource type', async () => {
    const readContentProperty = vi.fn(async () => ({
      value: {
        region: 'ap-southeast-2',
        resourceType: 'EC2',
        resourceId: 'i-0123456789abcdef0',
      },
    }));
    const read = createLegacyMacroConfigReader(readContentProperty);

    await expect(read({ contentId: '12345', uuid: 'legacy-uuid' })).resolves.toEqual({
      schemaVersion: 1,
      region: 'ap-southeast-2',
      resourceType: 'ec2',
      resourceId: 'i-0123456789abcdef0',
    });
    expect(readContentProperty).toHaveBeenCalledWith(
      '12345',
      'aws-widget-macro-legacy-uuid-body',
    );
  });

  it('preserves older working macros that predate the saved resourceType field', async () => {
    const read = createLegacyMacroConfigReader(async () => ({
      value: {
        region: 'us-east-1',
        resourceId: 'arn:aws:lambda:us-east-1:123456789012:function:orders',
      },
    }));

    await expect(read({ contentId: '12345', uuid: 'older-uuid' })).resolves.toMatchObject({
      resourceType: 'lambda',
      resourceId: 'arn:aws:lambda:us-east-1:123456789012:function:orders',
    });
  });
});

describe('legacy Connect credential migration', () => {
  it('decrypts the exact OpenSSL/CryptoJS format produced by the old Connect app', () => {
    const encrypted = 'U2FsdGVkX1/qahodnkhU+PXcppwhbCRM7+veBY1Vdusw0LDNX1NuA9wtu5HdBAW3lN6getckVPud8QcJ+BoHsVPFKGDxLDVhs8GrT5HuJfZpmpO5nkKNYlZB7sI1e/xfDGXmMvi4tPwyxuQpaXipiMJjJHVPIcNlFg41PFHf/co=';

    expect(decryptLegacyCredential(encrypted, 'https://legacy.atlassian.net')).toEqual({
      accessKeyId: 'FAKEACCESSKEY0001',
      secretAccessKey: 'fake-secret-access-key-that-is-at-least-32-chars',
    });
  });

  it('validates and stores a legacy credential server-side before returning it to AWS adapters', async () => {
    const encrypted = 'U2FsdGVkX1/qahodnkhU+PXcppwhbCRM7+veBY1Vdusw0LDNX1NuA9wtu5HdBAW3lN6getckVPud8QcJ+BoHsVPFKGDxLDVhs8GrT5HuJfZpmpO5nkKNYlZB7sI1e/xfDGXmMvi4tPwyxuQpaXipiMJjJHVPIcNlFg41PFHf/co=';
    const write = vi.fn();
    const validateWithAws = vi.fn(async () => undefined);
    const repository = createMigratingCredentialRepository({
      repository: { read: async () => undefined, write, delete: vi.fn() },
      readLegacyAppProperty: async () => ({
        value: { encrypted },
        self: 'https://legacy.atlassian.net/wiki/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials',
      }),
      validateWithAws,
      now: () => new Date('2026-08-28T10:00:00.000Z'),
    });

    const result = await repository.read();

    expect(validateWithAws).toHaveBeenCalledWith({
      accessKeyId: 'FAKEACCESSKEY0001',
      secretAccessKey: 'fake-secret-access-key-that-is-at-least-32-chars',
    });
    expect(result).toEqual({
      schemaVersion: 1,
      accessKeyId: 'FAKEACCESSKEY0001',
      secretAccessKey: 'fake-secret-access-key-that-is-at-least-32-chars',
      updatedAt: '2026-08-28T10:00:00.000Z',
    });
    expect(write).toHaveBeenCalledWith(result);
  });

  it('does not resurrect the old Connect credential after an administrator deletes it', async () => {
    let credential: StoredCredentialV1 | undefined;
    let migrationState: 'migrated' | 'manual' | 'disabled' | undefined;
    const readLegacyAppProperty = vi.fn(async () => ({
      value: { encrypted: 'must-not-be-read' },
      self: 'https://legacy.atlassian.net/wiki/rest/example',
    }));
    const repository = createMigratingCredentialRepository({
      repository: {
        read: async () => credential,
        write: async (value) => { credential = value; },
        delete: async () => { credential = undefined; },
      },
      migrationState: {
        read: async () => migrationState,
        write: async (value) => { migrationState = value; },
      },
      readLegacyAppProperty,
      validateWithAws: vi.fn(),
      now: () => new Date(),
    });

    await repository.delete();

    await expect(repository.read()).resolves.toBeUndefined();
    expect(migrationState).toBe('disabled');
    expect(readLegacyAppProperty).not.toHaveBeenCalled();
  });

  it('does not write a replacement secret if the disabled migration marker cannot be cleared', async () => {
    const write = vi.fn();
    const repository = createMigratingCredentialRepository({
      repository: { read: vi.fn(), write, delete: vi.fn() },
      migrationState: {
        read: async () => 'disabled',
        write: async () => { throw new Error('state unavailable'); },
      },
      readLegacyAppProperty: vi.fn(),
      validateWithAws: vi.fn(),
      now: () => new Date(),
    });

    await expect(repository.write({
      schemaVersion: 1,
      accessKeyId: 'FAKEACCESSKEY0001',
      secretAccessKey: 'fake-secret-access-key-that-is-at-least-32-chars',
      updatedAt: '2026-08-28T10:00:00.000Z',
    })).rejects.toThrow('state unavailable');
    expect(write).not.toHaveBeenCalled();
  });
});
