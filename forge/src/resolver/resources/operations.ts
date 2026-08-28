import { PublicResolverError } from '../errors.js';
import { parseMacroConfig, parseResourceListInput } from '../resource-schemas.js';
import type { CredentialRepository } from '../credentials/repository.js';
import type { ResourceAdapterFactory, ResourceOperations } from './types.js';

type ResourceDependencies = {
  repository: CredentialRepository;
  createAdapter: ResourceAdapterFactory;
};

export const createResourceOperations = ({
  repository,
  createAdapter,
}: ResourceDependencies): ResourceOperations => ({
  list: async (payload) => {
    const input = parseResourceListInput(payload);
    const credential = await repository.read();
    if (!credential) throw new PublicResolverError('NOT_CONFIGURED');
    const adapter = createAdapter(input.resourceType, input.region, credential);
    try {
      if (!adapter.list) throw new PublicResolverError('INVALID_INPUT');
      return await adapter.list();
    } finally {
      adapter.dispose?.();
    }
  },
  describe: async (payload) => {
    const input = parseMacroConfig(payload);
    const credential = await repository.read();
    if (!credential) throw new PublicResolverError('NOT_CONFIGURED');
    const adapter = createAdapter(input.resourceType, input.region, credential);
    try {
      return await adapter.describe(input.resourceId);
    } finally {
      adapter.dispose?.();
    }
  },
});
