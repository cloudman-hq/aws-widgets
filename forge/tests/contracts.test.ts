import { describe, expect, it } from 'vitest';
import {
  PUBLIC_ERROR_CODES,
  RESOLVER_OPERATIONS,
  RESOURCE_TYPES,
  SUPPORTED_REGIONS,
} from '../src/shared/contracts.js';

describe('shared browser/resolver contract', () => {
  it('publishes the five resource types and both AWS partitions', () => {
    expect(RESOURCE_TYPES).toEqual(['ec2', 's3', 'lambda', 'ecs', 'dynamodb']);
    expect(SUPPORTED_REGIONS).toContain('us-east-1');
    expect(SUPPORTED_REGIONS).toContain('cn-north-1');
  });

  it('publishes only the approved resolver operations and public errors', () => {
    expect(RESOLVER_OPERATIONS).toHaveLength(7);
    expect(RESOLVER_OPERATIONS).toContain('macro.config.resolve');
    expect(RESOLVER_OPERATIONS).toContain('resource.describe');
    expect(PUBLIC_ERROR_CODES).toContain('INTERNAL_ERROR');
    expect(PUBLIC_ERROR_CODES).not.toContain('NOT_IMPLEMENTED');
  });
});
