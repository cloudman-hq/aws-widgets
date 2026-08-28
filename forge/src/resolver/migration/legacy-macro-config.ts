import type { MacroConfigV1, ResourceType } from '../../shared/contracts';
import { parseMacroConfig } from '../resource-schemas';

export const LEGACY_MACRO_PROPERTY_PREFIX = 'aws-widget-macro-';

type LegacyMacroReference = { contentId: string; uuid: string };
type ReadContentProperty = (
  contentId: string,
  propertyKey: string,
) => Promise<unknown | undefined>;

const LEGACY_RESOURCE_TYPES: Record<string, ResourceType> = {
  EC2: 'ec2',
  S3: 's3',
  Lambda: 'lambda',
  ECS: 'ecs',
  Dynamodb: 'dynamodb',
};

const inferLegacyResourceType = (resourceId: unknown): ResourceType | undefined => {
  if (typeof resourceId !== 'string') return undefined;
  if (/^i-[0-9a-f]+$/.test(resourceId)) return 'ec2';
  if (/^arn:(?:aws|aws-cn):lambda:/.test(resourceId)) return 'lambda';
  if (/^arn:(?:aws|aws-cn):dynamodb:/.test(resourceId)) return 'dynamodb';
  if (/^arn:(?:aws|aws-cn):ecs:/.test(resourceId)) return 'ecs';
  if (/^arn:(?:aws|aws-cn):s3:::/.test(resourceId)) return 's3';
  return undefined;
};

export const createLegacyMacroConfigReader = (
  readContentProperty: ReadContentProperty,
) => async ({ contentId, uuid }: LegacyMacroReference): Promise<MacroConfigV1 | undefined> => {
  const property = await readContentProperty(
    contentId,
    `${LEGACY_MACRO_PROPERTY_PREFIX}${uuid}-body`,
  );
  if (typeof property !== 'object' || property === null) return undefined;
  const value = Reflect.get(property, 'value');
  if (typeof value !== 'object' || value === null) return undefined;
  const legacyType = Reflect.get(value, 'resourceType');
  const resourceId = Reflect.get(value, 'resourceId');
  const resourceType = typeof legacyType === 'string'
    ? LEGACY_RESOURCE_TYPES[legacyType] ?? legacyType.toLowerCase()
    : inferLegacyResourceType(resourceId);
  return parseMacroConfig({
    schemaVersion: 1,
    region: Reflect.get(value, 'region'),
    resourceType,
    resourceId,
  });
};
