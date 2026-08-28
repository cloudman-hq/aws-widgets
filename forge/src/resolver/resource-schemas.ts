import {
  RESOURCE_TYPES,
  SUPPORTED_REGIONS,
  type MacroConfigV1,
  type ResourceType,
  type SupportedRegion,
} from '../shared/contracts';
import { PublicResolverError } from './errors';

type ResourceListInput = {
  region: SupportedRegion;
  resourceType: Exclude<ResourceType, 's3'>;
};

const LISTABLE_RESOURCE_TYPES = ['ec2', 'lambda', 'ecs', 'dynamodb'] as const;
const ACCOUNT_ID = '[0-9]{12}';

const invalidInput = (): never => {
  throw new PublicResolverError('INVALID_INPUT');
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
};

const parseRegion = (value: unknown): SupportedRegion => {
  if (typeof value !== 'string' || !SUPPORTED_REGIONS.includes(value as SupportedRegion)) {
    return invalidInput();
  }
  return value as SupportedRegion;
};

const parseResourceType = (value: unknown): ResourceType => {
  if (typeof value !== 'string' || !RESOURCE_TYPES.includes(value as ResourceType)) {
    return invalidInput();
  }
  return value as ResourceType;
};

const expectedPartition = (region: SupportedRegion): 'aws' | 'aws-cn' =>
  region.startsWith('cn-') ? 'aws-cn' : 'aws';

const parseBoundedIdentifier = (value: unknown): string => {
  if (typeof value !== 'string') return invalidInput();
  const identifier = value.trim();
  const hasUnsafeCharacter = [...identifier].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 32 || codePoint === 127 || character === '*' || character === '?';
  });
  if (
    identifier.length === 0 ||
    identifier.length > 512 ||
    hasUnsafeCharacter ||
    identifier.includes('://') ||
    identifier.includes('..')
  ) {
    return invalidInput();
  }
  return identifier;
};

const isDnsBucketName = (value: string): boolean => {
  if (
    value.length < 3 ||
    value.length > 63 ||
    !/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(value) ||
    value.includes('..') ||
    value.includes('.-') ||
    value.includes('-.') ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)
  ) {
    return false;
  }
  return true;
};

const parseResourceId = (
  resourceType: ResourceType,
  region: SupportedRegion,
  value: unknown,
): string => {
  const identifier = parseBoundedIdentifier(value);
  const partition = expectedPartition(region);

  if (resourceType === 'ec2') {
    return /^i-(?:[0-9a-f]{8}|[0-9a-f]{17})$/.test(identifier)
      ? identifier
      : invalidInput();
  }

  if (resourceType === 's3') {
    const arnMatch = /^arn:(aws|aws-cn):s3:::(.+)$/.exec(identifier);
    const bucketName = arnMatch
      ? arnMatch[1] === partition
        ? arnMatch[2]!
        : invalidInput()
      : identifier;
    return isDnsBucketName(bucketName) ? bucketName : invalidInput();
  }

  if (resourceType === 'lambda') {
    if (/^[A-Za-z0-9_-]{1,64}$/.test(identifier)) return identifier;
    const match = new RegExp(
      `^arn:(aws|aws-cn):lambda:([^:]+):${ACCOUNT_ID}:function:([A-Za-z0-9_-]{1,64})$`,
    ).exec(identifier);
    return match && match[1] === partition && match[2] === region
      ? identifier
      : invalidInput();
  }

  if (resourceType === 'ecs') {
    if (/^[A-Za-z0-9_-]{1,255}$/.test(identifier)) return identifier;
    const match = new RegExp(
      `^arn:(aws|aws-cn):ecs:([^:]+):${ACCOUNT_ID}:cluster/([A-Za-z0-9_-]{1,255})$`,
    ).exec(identifier);
    return match && match[1] === partition && match[2] === region
      ? identifier
      : invalidInput();
  }

  if (/^[A-Za-z0-9_.-]{3,255}$/.test(identifier)) return identifier;
  const match = new RegExp(
    `^arn:(aws|aws-cn):dynamodb:([^:]+):${ACCOUNT_ID}:table/([A-Za-z0-9_.-]{3,255})$`,
  ).exec(identifier);
  return match && match[1] === partition && match[2] === region
    ? match[3]!
    : invalidInput();
};

export const parseResourceListInput = (payload: unknown): ResourceListInput => {
  if (!isPlainObject(payload) || !hasOnlyKeys(payload, ['region', 'resourceType'])) {
    return invalidInput();
  }
  const region = parseRegion(payload.region);
  const resourceType = parseResourceType(payload.resourceType);
  if (!LISTABLE_RESOURCE_TYPES.includes(resourceType as ResourceListInput['resourceType'])) {
    return invalidInput();
  }
  return { region, resourceType: resourceType as ResourceListInput['resourceType'] };
};

export const parseMacroConfig = (payload: unknown): MacroConfigV1 => {
  if (
    !isPlainObject(payload) ||
    !hasOnlyKeys(payload, ['schemaVersion', 'region', 'resourceType', 'resourceId']) ||
    payload.schemaVersion !== 1
  ) {
    return invalidInput();
  }
  const region = parseRegion(payload.region);
  const resourceType = parseResourceType(payload.resourceType);
  return {
    schemaVersion: 1,
    region,
    resourceType,
    resourceId: parseResourceId(resourceType, region, payload.resourceId),
  };
};
