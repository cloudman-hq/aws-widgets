import type { Request } from '@forge/resolver';
import type { CredentialRepository } from './credentials/repository.js';
import { createCredentialOperations } from './credentials/operations.js';
import { authorizeModule, SETTINGS_MODULE_KEY } from './authorization.js';
import type { CredentialInput } from './schemas.js';
import { toSafeEnvelope, type SafeLogEvent } from './safety.js';

type ResolverDependencies = {
  repository: CredentialRepository;
  validateWithAws: (credential: CredentialInput) => Promise<void>;
  now: () => Date;
  createRequestId: () => string;
  log: (event: SafeLogEvent) => void;
};

export const createResolverHandlers = (dependencies: ResolverDependencies) => {
  const operations = createCredentialOperations(dependencies);
  const credentialHandler =
    <T>(
      operation: 'credentials.status' | 'credentials.validate' | 'credentials.save' | 'credentials.delete',
      execute: (payload: unknown) => Promise<T>,
    ) =>
    ({ payload, context }: Request<unknown>) => {
      const requestId = dependencies.createRequestId();
      return toSafeEnvelope(
        requestId,
        operation,
        async () => {
          authorizeModule(context, SETTINGS_MODULE_KEY);
          return execute(payload);
        },
        dependencies.log,
      );
    };

  return {
    'credentials.status': credentialHandler('credentials.status', operations.status),
    'credentials.validate': credentialHandler('credentials.validate', operations.validate),
    'credentials.save': credentialHandler('credentials.save', operations.save),
    'credentials.delete': credentialHandler('credentials.delete', operations.delete),
  };
};
