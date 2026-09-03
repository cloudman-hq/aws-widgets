import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import type { CredentialInput } from '../schemas';
import { mapAwsError } from './errors';

type CredentialValidatorDependencies = {
  getCallerIdentity: (
    credential: CredentialInput,
    region: 'us-east-1' | 'cn-north-1',
  ) => Promise<unknown>;
};

export const createCredentialValidator = ({
  getCallerIdentity,
}: CredentialValidatorDependencies) => async (credential: CredentialInput): Promise<void> => {
  for (const region of ['us-east-1', 'cn-north-1'] as const) {
    try {
      await getCallerIdentity(credential, region);
      return;
    } catch (error: unknown) {
      const mapped = mapAwsError(error);
      if (mapped.code !== 'INVALID_AUTH' || region === 'cn-north-1') throw mapped;
    }
  }
};

const getCallerIdentity = async (
  credential: CredentialInput,
  region: 'us-east-1' | 'cn-north-1',
): Promise<unknown> => {
  const client = new STSClient({
    region,
    credentials: credential,
    maxAttempts: 2,
  });
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 8_000);

  try {
    return await client.send(new GetCallerIdentityCommand({}), {
      abortSignal: abortController.signal,
    });
  } finally {
    clearTimeout(timeout);
    client.destroy();
  }
};

export const validateCredentialWithAws = createCredentialValidator({ getCallerIdentity });
