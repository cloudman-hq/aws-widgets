import type { Request } from '@forge/resolver';
import type { CredentialRepository } from './credentials/repository';
import { createCredentialOperations } from './credentials/operations';
import { authorizeModule, MACRO_MODULE_KEY, SETTINGS_MODULE_KEY } from './authorization';
import type { CredentialInput } from './schemas';
import { toSafeEnvelope, type SafeLogEvent } from './safety';
import { createResourceOperations } from './resources/operations';
import type { ResourceAdapterFactory } from './resources/types';
import { PublicResolverError } from './errors';

type ResolverDependencies = {
  repository: CredentialRepository;
  validateWithAws: (credential: CredentialInput) => Promise<void>;
  now: () => Date;
  createRequestId: () => string;
  log: (event: SafeLogEvent) => void;
  createResourceAdapter?: ResourceAdapterFactory;
};

export const createResolverHandlers = (dependencies: ResolverDependencies) => {
  const operations = createCredentialOperations(dependencies);
  const resourceOperations = createResourceOperations({
    repository: dependencies.repository,
    createAdapter: dependencies.createResourceAdapter ?? (() => {
      throw new PublicResolverError('INTERNAL_ERROR', true);
    }),
  });
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

  const resourceHandler =
    <T>(
      operation: 'resource.list' | 'resource.describe',
      execute: (payload: unknown) => Promise<T>,
    ) =>
    ({ payload, context }: Request<unknown>) => {
      const requestId = dependencies.createRequestId();
      return toSafeEnvelope(
        requestId,
        operation,
        async () => {
          authorizeModule(context, MACRO_MODULE_KEY);
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
    'resource.list': resourceHandler('resource.list', resourceOperations.list),
    'resource.describe': resourceHandler('resource.describe', resourceOperations.describe),
  };
};
