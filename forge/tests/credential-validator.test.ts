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
    expect(getCallerIdentity).toHaveBeenCalledWith(credential);
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
