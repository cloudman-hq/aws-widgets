import type {
  MacroConfigV1,
  ResourceOptions,
  ResourceType,
  ResourceView,
  SupportedRegion,
} from '../../shared/contracts.js';
import type { StoredCredentialV1 } from '../credentials/repository.js';

export type ResourceAdapter = {
  list?: () => Promise<ResourceOptions>;
  describe: (resourceId: string) => Promise<ResourceView>;
  dispose?: () => void;
};

export type ResourceAdapterFactory = (
  resourceType: ResourceType,
  region: SupportedRegion,
  credential: StoredCredentialV1,
) => ResourceAdapter;

export type ResourceOperations = {
  list(payload: unknown): Promise<ResourceOptions>;
  describe(payload: unknown): Promise<ResourceView>;
};

export type ParsedDescribeInput = MacroConfigV1;
