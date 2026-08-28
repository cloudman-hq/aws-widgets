import { describe, expect, it } from 'vitest';
import { parseMacroConfig, parseResourceListInput } from '../src/resolver/resource-schemas.js';

describe('resource request schemas', () => {
  it('accepts only allow-listed regions, types, and fields for list requests', () => {
    expect(parseResourceListInput({ region: 'us-east-1', resourceType: 'ec2' })).toEqual({
      region: 'us-east-1',
      resourceType: 'ec2',
    });
    expect(() =>
      parseResourceListInput({
        region: 'attacker.invalid',
        resourceType: 'ec2',
        endpoint: 'https://attacker.invalid',
      }),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
    expect(() =>
      parseResourceListInput({ region: 'us-east-1', resourceType: 's3' }),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
  });

  it('validates type-specific identifiers and normalizes bucket ARNs', () => {
    expect(
      parseMacroConfig({
        schemaVersion: 1,
        region: 'cn-north-1',
        resourceType: 's3',
        resourceId: 'arn:aws-cn:s3:::safe-example-bucket',
      }),
    ).toEqual({
      schemaVersion: 1,
      region: 'cn-north-1',
      resourceType: 's3',
      resourceId: 'safe-example-bucket',
    });
    expect(() =>
      parseMacroConfig({
        schemaVersion: 1,
        region: 'us-east-1',
        resourceType: 'ec2',
        resourceId: 'https://example.com/i-12345678',
      }),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
    expect(() =>
      parseMacroConfig({
        schemaVersion: 1,
        region: 'us-east-1',
        resourceType: 'lambda',
        resourceId: 'arn:aws:lambda:eu-west-1:123456789012:function:wrong-region',
      }),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
  });
});
