import type { SupportedRegion } from '../../shared/contracts.js';
import { PublicResolverError } from '../errors.js';
import type { ResourceAdapter } from '../resources/types.js';
import { definedFields, formatTags, makeField, safeString } from './common.js';
import { mapAwsError } from './errors.js';

export type S3Api = {
  getBucketPolicyStatus(input: { bucket: string }): Promise<{
    policyStatus?: { isPublic?: unknown | undefined } | undefined;
  }>;
  getBucketEncryption(input: { bucket: string }): Promise<{
    rules?: Array<{ algorithm?: unknown | undefined }> | undefined;
  }>;
  getBucketLifecycleConfiguration(input: { bucket: string }): Promise<{
    rules?: Array<{ id?: unknown | undefined }> | undefined;
  }>;
  getBucketTagging(input: { bucket: string }): Promise<{
    tagSet?: Array<{ key?: unknown | undefined; value?: unknown | undefined }> | undefined;
  }>;
};

type Settled = PromiseSettledResult<unknown>;

const topLevelError = (results: Settled[]): PublicResolverError | undefined => {
  const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  for (const failure of failures) {
    const mapped = mapAwsError(failure.reason);
    if (mapped.code === 'NOT_FOUND' || mapped.code === 'INVALID_AUTH') return mapped;
  }
  if (failures.length === results.length) {
    return failures.length > 0 ? mapAwsError(failures[0]!.reason) : undefined;
  }
  return undefined;
};

export const createS3Adapter = (
  api: S3Api,
  region: SupportedRegion,
  now: () => Date,
): ResourceAdapter => ({
  describe: async (resourceId) => {
    const input = { bucket: resourceId };
    const results = await Promise.allSettled([
      api.getBucketPolicyStatus(input),
      api.getBucketEncryption(input),
      api.getBucketLifecycleConfiguration(input),
      api.getBucketTagging(input),
    ]);
    const fatal = topLevelError(results);
    if (fatal) throw fatal;

    const policy = results[0]?.status === 'fulfilled'
      ? results[0].value as Awaited<ReturnType<S3Api['getBucketPolicyStatus']>>
      : undefined;
    const encryption = results[1]?.status === 'fulfilled'
      ? results[1].value as Awaited<ReturnType<S3Api['getBucketEncryption']>>
      : undefined;
    const lifecycle = results[2]?.status === 'fulfilled'
      ? results[2].value as Awaited<ReturnType<S3Api['getBucketLifecycleConfiguration']>>
      : undefined;
    const tagging = results[3]?.status === 'fulfilled'
      ? results[3].value as Awaited<ReturnType<S3Api['getBucketTagging']>>
      : undefined;

    const lifecycleIds = (lifecycle?.rules ?? [])
      .flatMap((rule) => safeString(rule.id, 256) ?? [])
      .slice(0, 50)
      .sort();
    const algorithm = encryption?.rules
      ?.map((rule) => safeString(rule.algorithm, 64))
      .find((value): value is string => value !== undefined);
    const isPublic = typeof policy?.policyStatus?.isPublic === 'boolean'
      ? String(policy.policyStatus.isPublic)
      : undefined;

    return {
      schemaVersion: 1,
      resourceType: 's3',
      resourceId,
      region,
      title: resourceId,
      fields: definedFields([
        makeField('bucketName', 'Bucket name', resourceId),
        makeField('publicPolicy', 'Public policy', isPublic),
        makeField('defaultEncryption', 'Default encryption', algorithm),
        makeField('lifecycleRuleIds', 'Lifecycle rules', lifecycleIds),
        makeField('tags', 'Tags', formatTags(tagging?.tagSet)),
      ]),
      observedAt: now().toISOString(),
    };
  },
});

export const unsupportedS3List = (): never => {
  throw new PublicResolverError('INVALID_INPUT');
};
