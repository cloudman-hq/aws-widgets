export const SUPPORTED_REGIONS = [
  'ap-southeast-2',
  'us-east-2',
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'af-south-1',
  'ap-east-1',
  'ap-south-1',
  'ap-northeast-3',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-northeast-1',
  'ca-central-1',
  'cn-north-1',
  'cn-northwest-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-south-1',
  'eu-west-3',
  'eu-north-1',
  'me-south-1',
  'sa-east-1',
] as const;

export const RESOURCE_TYPES = ['ec2', 's3', 'lambda', 'ecs', 'dynamodb'] as const;

export const RESOLVER_OPERATIONS = [
  'macro.config.resolve',
  'credentials.status',
  'credentials.validate',
  'credentials.save',
  'credentials.delete',
  'resource.list',
  'resource.describe',
] as const;

export const PUBLIC_ERROR_CODES = [
  'INVALID_INPUT',
  'UNAUTHORIZED',
  'NOT_CONFIGURED',
  'INVALID_AUTH',
  'PERMISSION_DENIED',
  'NOT_FOUND',
  'THROTTLED',
  'NETWORK_ERROR',
  'RESULT_LIMIT',
  'INTERNAL_ERROR',
] as const;

export type SupportedRegion = (typeof SUPPORTED_REGIONS)[number];
export type ResourceType = (typeof RESOURCE_TYPES)[number];
export type ResolverOperation = (typeof RESOLVER_OPERATIONS)[number];
export type PublicErrorCode = (typeof PUBLIC_ERROR_CODES)[number];

export type MacroConfigV1 = {
  schemaVersion: 1;
  region: SupportedRegion;
  resourceType: ResourceType;
  resourceId: string;
};

export type MacroConfigResolution = {
  config?: MacroConfigV1;
  source: 'forge' | 'connect' | 'none';
};

export type CredentialStatus = { configured: boolean; updatedAt?: string };

export type ResourceOptions = {
  items: Array<{ id: string; label: string }>;
  truncated: false;
};

export type ResourceView = {
  schemaVersion: 1;
  resourceType: ResourceType;
  resourceId: string;
  region: SupportedRegion;
  title: string;
  fields: Array<{ key: string; label: string; value: string | string[] }>;
  observedAt: string;
};

export type ResolverSuccess<T> = { ok: true; data: T; requestId: string };
export type ResolverFailure = {
  ok: false;
  error: { code: PublicErrorCode; retryable: boolean };
  requestId: string;
};
export type ResolverEnvelope<T> = ResolverSuccess<T> | ResolverFailure;
