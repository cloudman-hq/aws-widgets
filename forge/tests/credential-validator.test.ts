import { describe, expect, it, vi } from 'vitest';
import { createCredentialValidator } from '../src/resolver/aws/credential-validator.js';

describe('AWS credential validation', () => {
  it('uses the entered credential only for GetCallerIdentity and returns nothing', async () => {
    const credential = {
      accessKeyId: 'FAKEACCESSKEY0001',
      secretAccessKey: 'fake-secret-access-key-that-is-never-returned',
      sessionToken: 'fake-session-token-that-is-never-returned',
    };
    const getCallerIdentity = vi.fn(async () => ({ account: '000000000000' }));
    const validate = createCredentialValidator({ getCallerIdentity });

    await expect(validate(credential)).resolves.toBeUndefined();
    expect(getCallerIdentity).toHaveBeenCalledWith(credential, 'us-east-1');
  });

  it('falls back to the China partition only after commercial authentication fails', async () => {
    const credential = {
      accessKeyId: 'FAKEACCESSKEY0001',
      secretAccessKey: 'fake-secret-access-key-that-is-never-returned',
    };
    const getCallerIdentity = vi.fn(async (_credential, region: string) => {
      if (region === 'us-east-1') {
        throw Object.assign(new Error('commercial auth failed'), { name: 'InvalidClientTokenId' });
      }
      return {};
    });
    const validate = createCredentialValidator({ getCallerIdentity });

    await expect(validate(credential)).resolves.toBeUndefined();
    expect(getCallerIdentity.mock.calls.map((call) => call[1])).toEqual([
      'us-east-1',
      'cn-north-1',
    ]);
  });

  it('maps an AWS authentication failure without retaining its raw message', async () => {
    const rawError = Object.assign(new Error('raw AWS response with secret details'), {
      name: 'InvalidClientTokenId',
    });
    const validate = createCredentialValidator({
      getCallerIdentity: async () => {
        throw rawError;
      },
    });

    await expect(
      validate({
        accessKeyId: 'FAKEACCESSKEY0001',
        secretAccessKey: 'fake-secret-access-key-that-is-never-returned',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_AUTH', message: 'INVALID_AUTH' });
  });
});
