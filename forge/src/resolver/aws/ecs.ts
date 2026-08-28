import type { SupportedRegion } from '../../shared/contracts';
import { PublicResolverError } from '../errors';
import type { ResourceAdapter } from '../resources/types';
import {
  assertPageWithinLimit,
  definedFields,
  finishOptions,
  makeField,
  resultLimitIfNeeded,
  safeString,
} from './common';
import { mapAwsError } from './errors';

export type EcsApi = {
  listClusters(input: { nextToken?: string }): Promise<{
    clusterArns?: unknown[] | undefined;
    nextToken?: unknown | undefined;
  }>;
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
  list: async () => {
    try {
      const items = new Map<string, string>();
      let nextToken: string | undefined;
      for (let pageNumber = 1; ; pageNumber += 1) {
        const page = await api.listClusters(nextToken ? { nextToken } : {});
        for (const value of page.clusterArns ?? []) {
          const id = safeString(value, 512);
          if (!id) continue;
          items.set(id, clusterNameFromArn(id));
          resultLimitIfNeeded(items);
        }
        assertPageWithinLimit(pageNumber, page.nextToken);
        nextToken = safeString(page.nextToken, 2048);
        if (!nextToken) return finishOptions(items);
      }
    } catch (error: unknown) {
      if (error instanceof PublicResolverError) throw error;
      throw mapAwsError(error);
    }
  },
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
