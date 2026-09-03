import type { SupportedRegion } from '../../shared/contracts';
import { PublicResolverError } from '../errors';
import type { ResourceAdapter } from '../resources/types';
import {
  definedFields,
  makeField,
  safeNumber,
  safeString,
} from './common';
import { mapAwsError } from './errors';

export type DynamoDbApi = {
  describeTable(input: { tableName: string }): Promise<{
    table?: { tableName?: unknown | undefined; tableStatus?: unknown | undefined; itemCount?: unknown | undefined } | undefined;
  }>;
};

export const createDynamoDbAdapter = (
  api: DynamoDbApi,
  region: SupportedRegion,
  now: () => Date,
): ResourceAdapter => ({
  describe: async (resourceId) => {
    try {
      const result = await api.describeTable({ tableName: resourceId });
      if (!result.table) throw new PublicResolverError('NOT_FOUND');
      const name = safeString(result.table.tableName, 255) ?? resourceId;
      return {
        schemaVersion: 1,
        resourceType: 'dynamodb',
        resourceId,
        region,
        title: name,
        fields: definedFields([
          makeField('tableName', 'Table name', name),
          makeField('tableStatus', 'Table status', safeString(result.table.tableStatus, 64)),
          makeField('itemCount', 'Item count', safeNumber(result.table.itemCount)),
        ]),
        observedAt: now().toISOString(),
      };
    } catch (error: unknown) {
      if (error instanceof PublicResolverError) throw error;
      throw mapAwsError(error);
    }
  },
});
