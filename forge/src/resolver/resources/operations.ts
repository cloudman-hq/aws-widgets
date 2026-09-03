import { PublicResolverError } from '../errors';
import { parseMacroConfig } from '../resource-schemas';
import type { CredentialRepository } from '../credentials/repository';
import type { ResourceAdapterFactory, ResourceOperations } from './types';

type ResourceDependencies = {
  repository: CredentialRepository;
  createAdapter: ResourceAdapterFactory;
};

export const createResourceOperations = ({
  repository,
  createAdapter,
}: ResourceDependencies): ResourceOperations => ({
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
