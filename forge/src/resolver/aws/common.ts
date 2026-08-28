import type { ResourceOptions, ResourceView } from '../../shared/contracts.js';
import { PublicResolverError } from '../errors.js';

export const MAX_RESOURCE_ITEMS = 500;
export const MAX_AWS_PAGES = 50;

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

export type ViewField = ResourceView['fields'][number];

export const safeString = (value: unknown, maxLength = 512): string | undefined => {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) return undefined;
  if ([...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint < 32 || codePoint === 127;
  })) return undefined;
  return value;
};

export const safeNumber = (value: unknown): string | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined;

export const makeField = (
  key: string,
  label: string,
  value: string | string[] | undefined,
): ViewField | undefined => {
  if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    return undefined;
  }
  return { key, label, value };
};

export const definedFields = (fields: Array<ViewField | undefined>): ViewField[] =>
  fields.filter((field): field is ViewField => field !== undefined);

export type AwsTag = { key?: unknown | undefined; value?: unknown | undefined };

export const formatTags = (tags: readonly AwsTag[] | undefined): string[] => {
  if (!tags) return [];
  return tags
    .slice(0, 50)
    .flatMap((tag) => {
      const key = safeString(tag.key, 128);
      const value = safeString(tag.value, 256);
      return key && value ? [`${key}: ${value}`] : [];
    })
    .sort(compareText);
};

export const finishOptions = (items: Map<string, string>): ResourceOptions => {
  if (items.size > MAX_RESOURCE_ITEMS) throw new PublicResolverError('RESULT_LIMIT');
  return {
    items: [...items]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => compareText(a.id, b.id)),
    truncated: false,
  };
};

export const assertPageWithinLimit = (page: number, nextToken: unknown): void => {
  if (page >= MAX_AWS_PAGES && typeof nextToken === 'string' && nextToken.length > 0) {
    throw new PublicResolverError('RESULT_LIMIT');
  }
};

export const resultLimitIfNeeded = (items: Map<string, string>): void => {
  if (items.size > MAX_RESOURCE_ITEMS) throw new PublicResolverError('RESULT_LIMIT');
};
