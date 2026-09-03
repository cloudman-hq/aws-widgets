import type {
  MacroConfigV1,
  ResourceType,
  ResourceView,
  SupportedRegion,
} from '../../shared/contracts';
import type { StoredCredentialV1 } from '../credentials/repository';

export type ResourceAdapter = {
  describe: (resourceId: string) => Promise<ResourceView>;
  dispose?: () => void;
};

export type ResourceAdapterFactory = (
  resourceType: ResourceType,
  region: SupportedRegion,
  credential: StoredCredentialV1,
) => ResourceAdapter;

export type ResourceOperations = {
  describe(payload: unknown): Promise<ResourceView>;
};

export type ParsedDescribeInput = MacroConfigV1;
