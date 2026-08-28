import type { SupportedRegion } from '../../shared/contracts';
import { PublicResolverError } from '../errors';
import type { ResourceAdapter } from '../resources/types';
import {
  assertPageWithinLimit,
  definedFields,
  finishOptions,
  formatTags,
  makeField,
  resultLimitIfNeeded,
  safeString,
} from './common';
import { mapAwsError } from './errors';

export type LambdaApi = {
  listFunctions(input: { marker?: string }): Promise<{
    functions?: Array<{ functionName?: unknown | undefined; functionArn?: unknown | undefined }> | undefined;
    nextMarker?: unknown | undefined;
  }>;
  getFunction(input: { functionName: string }): Promise<{
    configuration?: {
      functionName?: unknown | undefined;
      functionArn?: unknown | undefined;
      runtime?: unknown | undefined;
      role?: unknown | undefined;
      lastUpdateStatus?: unknown | undefined;
    } | undefined;
  }>;
  listTags(input: { resource: string }): Promise<{ tags?: Record<string, unknown> | undefined }>;
};

export const createLambdaAdapter = (
  api: LambdaApi,
  region: SupportedRegion,
  now: () => Date,
): ResourceAdapter => ({
  list: async () => {
    try {
      const items = new Map<string, string>();
      let marker: string | undefined;
      for (let pageNumber = 1; ; pageNumber += 1) {
        const page = await api.listFunctions(marker ? { marker } : {});
        for (const fn of page.functions ?? []) {
          const id = safeString(fn.functionArn, 512) ?? safeString(fn.functionName, 64);
          if (!id) continue;
          items.set(id, safeString(fn.functionName, 64) ?? id);
          resultLimitIfNeeded(items);
        }
        assertPageWithinLimit(pageNumber, page.nextMarker);
        marker = safeString(page.nextMarker, 2048);
        if (!marker) return finishOptions(items);
      }
    } catch (error: unknown) {
      if (error instanceof PublicResolverError) throw error;
      throw mapAwsError(error);
    }
  },
  describe: async (resourceId) => {
    try {
      const result = await api.getFunction({ functionName: resourceId });
      const configuration = result.configuration;
      if (!configuration) throw new PublicResolverError('NOT_FOUND');
      const arn = safeString(configuration.functionArn, 512);
      let tags: string[] = [];
      if (arn) {
        try {
          const tagResult = await api.listTags({ resource: arn });
          tags = formatTags(
            Object.entries(tagResult.tags ?? {}).map(([key, value]) => ({ key, value })),
          );
        } catch (error: unknown) {
          if (mapAwsError(error).code !== 'PERMISSION_DENIED') throw error;
        }
      }
      const functionName = safeString(configuration.functionName, 64) ?? resourceId;
      return {
        schemaVersion: 1,
        resourceType: 'lambda',
        resourceId,
        region,
        title: functionName,
        fields: definedFields([
          makeField('functionName', 'Function name', functionName),
          makeField('runtime', 'Runtime', safeString(configuration.runtime, 64)),
          makeField('executionRoleArn', 'Execution role', safeString(configuration.role, 512)),
          makeField('lastUpdateStatus', 'Last update status', safeString(configuration.lastUpdateStatus, 64)),
          makeField('tags', 'Tags', tags),
        ]),
        observedAt: now().toISOString(),
      };
    } catch (error: unknown) {
      if (error instanceof PublicResolverError) throw error;
      throw mapAwsError(error);
    }
  },
});
