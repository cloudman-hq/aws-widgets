import type { CredentialStatus } from '../../shared/contracts';
import { parseCredentialInput, parseEmptyPayload, type CredentialInput } from '../schemas';
import type { CredentialRepository } from './repository';

type CredentialOperationsDependencies = {
  repository: CredentialRepository;
  validateWithAws: (credential: CredentialInput) => Promise<void>;
  now: () => Date;
};

export const createCredentialOperations = ({
  repository,
  validateWithAws,
  now,
}: CredentialOperationsDependencies) => ({
  status: async (_payload: unknown): Promise<CredentialStatus> => {
    parseEmptyPayload(_payload);
    const credential = await repository.read();

    return credential
      ? { configured: true, updatedAt: credential.updatedAt }
      : { configured: false };
  },
  delete: async (_payload: unknown): Promise<CredentialStatus> => {
    parseEmptyPayload(_payload);
    await repository.delete();
    return { configured: false };
  },
  save: async (payload: unknown): Promise<CredentialStatus> => {
    const credential = parseCredentialInput(payload);
    await validateWithAws(credential);
    const updatedAt = now().toISOString();
    await repository.write({ schemaVersion: 1, ...credential, updatedAt });
    return { configured: true, updatedAt };
  },
});
