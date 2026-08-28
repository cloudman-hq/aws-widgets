import type { Request } from '@forge/resolver';
import type { CredentialRepository } from './credentials/repository';
import { createCredentialOperations } from './credentials/operations';
import { authorizeModule, MACRO_MODULE_KEY, SETTINGS_MODULE_KEY } from './authorization';
import type { CredentialInput } from './schemas';
import { toSafeEnvelope, type SafeLogEvent } from './safety';
import { createResourceOperations } from './resources/operations';
import type { ResourceAdapterFactory } from './resources/types';
import { PublicResolverError } from './errors';
import { parseMacroConfig } from './resource-schemas';
import type { MacroConfigV1, MacroConfigResolution } from '../shared/contracts';

type LegacyMacroReference = { contentId: string; uuid: string };

type ResolverDependencies = {
  repository: CredentialRepository;
  validateWithAws: (credential: CredentialInput) => Promise<void>;
  now: () => Date;
  createRequestId: () => string;
  log: (event: SafeLogEvent) => void;
  createResourceAdapter?: ResourceAdapterFactory;
  resolveLegacyMacroConfig?: (reference: LegacyMacroReference) => Promise<MacroConfigV1 | undefined>;
};

const resolveMacroConfig = async (
  context: Request<unknown>['context'],
  resolveLegacy?: ResolverDependencies['resolveLegacyMacroConfig'],
): Promise<MacroConfigResolution> => {
  const extension = Reflect.get(context, 'extension');
  if (typeof extension !== 'object' || extension === null) {
    throw new PublicResolverError('INVALID_INPUT');
  }
  const rawConfig = Reflect.get(extension, 'config');
  try {
    return { config: parseMacroConfig(rawConfig), source: 'forge' };
  } catch {
    // Existing Connect macros expose their original parameters in config.
  }
  const uuid = typeof rawConfig === 'object' && rawConfig !== null
    ? Reflect.get(rawConfig, 'uuid')
    : undefined;
  const content = Reflect.get(extension, 'content');
  const contentId = typeof content === 'object' && content !== null
    ? Reflect.get(content, 'id')
    : undefined;
  if (
    !resolveLegacy ||
    typeof uuid !== 'string' ||
    !/^[A-Za-z0-9-]{1,64}$/.test(uuid) ||
    typeof contentId !== 'string' ||
    !/^\d+$/.test(contentId)
  ) {
    return { source: 'none' };
  }
  const config = await resolveLegacy({ contentId, uuid });
  return config ? { config, source: 'connect' } : { source: 'none' };
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
    'macro.config.resolve': ({ context }: Request<unknown>) => {
      const requestId = dependencies.createRequestId();
      return toSafeEnvelope(
        requestId,
        'macro.config.resolve',
        async () => {
          authorizeModule(context, MACRO_MODULE_KEY);
          return resolveMacroConfig(context, dependencies.resolveLegacyMacroConfig);
        },
        dependencies.log,
      );
    },
    'credentials.status': credentialHandler('credentials.status', operations.status),
    'credentials.validate': credentialHandler('credentials.validate', operations.validate),
    'credentials.save': credentialHandler('credentials.save', operations.save),
    'credentials.delete': credentialHandler('credentials.delete', operations.delete),
    'resource.list': resourceHandler('resource.list', resourceOperations.list),
    'resource.describe': resourceHandler('resource.describe', resourceOperations.describe),
  };
};
