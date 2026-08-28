import type { SupportedRegion } from '../../shared/contracts';
import { PublicResolverError } from '../errors';
import type { ResourceAdapter } from '../resources/types';
import {
  assertPageWithinLimit,
  definedFields,
  finishOptions,
  makeField,
  resultLimitIfNeeded,
  safeNumber,
  safeString,
} from './common';
import { mapAwsError } from './errors';

export type DynamoDbApi = {
  listTables(input: { exclusiveStartTableName?: string }): Promise<{
    tableNames?: unknown[] | undefined;
    lastEvaluatedTableName?: unknown | undefined;
  }>;
  describeTable(input: { tableName: string }): Promise<{
    table?: { tableName?: unknown | undefined; tableStatus?: unknown | undefined; itemCount?: unknown | undefined } | undefined;
  }>;
};

export const createDynamoDbAdapter = (
  api: DynamoDbApi,
  region: SupportedRegion,
  now: () => Date,
): ResourceAdapter => ({
  list: async () => {
    try {
      const items = new Map<string, string>();
      let start: string | undefined;
      for (let pageNumber = 1; ; pageNumber += 1) {
        const page = await api.listTables(start ? { exclusiveStartTableName: start } : {});
        for (const value of page.tableNames ?? []) {
          const id = safeString(value, 255);
          if (!id) continue;
          items.set(id, id);
          resultLimitIfNeeded(items);
        }
        assertPageWithinLimit(pageNumber, page.lastEvaluatedTableName);
        start = safeString(page.lastEvaluatedTableName, 255);
        if (!start) return finishOptions(items);
      }
    } catch (error: unknown) {
      if (error instanceof PublicResolverError) throw error;
      throw mapAwsError(error);
    }
  },
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
