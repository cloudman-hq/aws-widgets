import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import type { CredentialInput } from '../schemas.js';
import { mapAwsError } from './errors.js';

type CredentialValidatorDependencies = {
  getCallerIdentity: (credential: CredentialInput) => Promise<unknown>;
};

export const createCredentialValidator = ({
  getCallerIdentity,
}: CredentialValidatorDependencies) => async (credential: CredentialInput): Promise<void> => {
  try {
    await getCallerIdentity(credential);
  } catch (error: unknown) {
    throw mapAwsError(error);
  }
};

const getCallerIdentity = async (credential: CredentialInput): Promise<unknown> => {
  const client = new STSClient({
    region: 'us-east-1',
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
