import type { SupportedRegion } from '../../shared/contracts';
import { PublicResolverError } from '../errors';
import type { ResourceAdapter } from '../resources/types';
import {
  definedFields,
  makeField,
  safeString,
} from './common';
import { mapAwsError } from './errors';

export type EcsApi = {
  describeClusters(input: { clusters: string[] }): Promise<{
    clusters?: Array<{ clusterArn?: unknown | undefined; clusterName?: unknown | undefined; status?: unknown | undefined }> | undefined;
    failures?: unknown[] | undefined;
  }>;
};

const clusterNameFromArn = (arn: string): string => arn.split('/').at(-1) ?? arn;

export const createEcsAdapter = (
  api: EcsApi,
  region: SupportedRegion,
  now: () => Date,
): ResourceAdapter => ({
  describe: async (resourceId) => {
    try {
      const result = await api.describeClusters({ clusters: [resourceId] });
      const cluster = result.clusters?.[0];
      if (!cluster || (result.failures?.length ?? 0) > 0) {
        throw new PublicResolverError('NOT_FOUND');
      }
      const name = safeString(cluster.clusterName, 255) ?? clusterNameFromArn(resourceId);
      return {
        schemaVersion: 1,
        resourceType: 'ecs',
        resourceId,
        region,
        title: name,
        fields: definedFields([
          makeField('clusterName', 'Cluster name', name),
          makeField('status', 'Status', safeString(cluster.status, 64)),
        ]),
        observedAt: now().toISOString(),
      };
    } catch (error: unknown) {
      if (error instanceof PublicResolverError) throw error;
      throw mapAwsError(error);
    }
  },
});
