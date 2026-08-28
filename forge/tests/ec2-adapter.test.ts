import { describe, expect, it } from 'vitest';
import { createEc2Adapter } from '../src/resolver/aws/ec2.js';
import { PublicResolverError } from '../src/resolver/errors.js';

describe('EC2 adapter', () => {
  it('normalizes and deterministically sorts list results', async () => {
    const adapter = createEc2Adapter({
      describeInstances: async () => ({
        reservations: [
          { instances: [{ instanceId: 'i-00000000000000002', privateIpAddress: '10.0.0.2' }] },
          { instances: [{ instanceId: 'i-00000000000000001', privateIpAddress: '10.0.0.1' }] },
        ],
      }),
    }, 'us-east-1', () => new Date('2026-08-28T00:00:00.000Z'));

    await expect(adapter.list!()).resolves.toEqual({
      items: [
        { id: 'i-00000000000000001', label: '10.0.0.1' },
        { id: 'i-00000000000000002', label: '10.0.0.2' },
      ],
      truncated: false,
    });
  });

  it('returns only allow-listed fields and maps an empty describe to NOT_FOUND', async () => {
    const adapter = createEc2Adapter({
      describeInstances: async ({ instanceIds }) => instanceIds
        ? {
            reservations: [{ instances: [{
              instanceId: instanceIds[0],
              state: { name: 'running' },
              instanceType: 't3.micro',
              privateIpAddress: '10.0.0.1',
              tags: [{ key: 'Name', value: 'web' }],
              rawSecretField: 'must not escape',
            } as never] }],
          }
        : {},
    }, 'us-east-1', () => new Date('2026-08-28T00:00:00.000Z'));

    const result = await adapter.describe('i-00000000000000001');
    expect(result.title).toBe('web');
    expect(result.fields.map((field) => field.key)).toEqual([
      'instanceId', 'state', 'instanceType', 'privateIpAddress', 'tags',
    ]);
    expect(JSON.stringify(result)).not.toContain('rawSecretField');

    const missing = createEc2Adapter({ describeInstances: async () => ({}) }, 'us-east-1', () => new Date());
    await expect(missing.describe('i-00000000000000001')).rejects.toEqual(
      new PublicResolverError('NOT_FOUND'),
    );
  });

  it('fails closed when a list exceeds 500 distinct resources', async () => {
    const adapter = createEc2Adapter({
      describeInstances: async () => ({
        reservations: [{
          instances: Array.from({ length: 501 }, (_, index) => ({
            instanceId: `i-${index.toString(16).padStart(17, '0')}`,
          })),
        }],
      }),
    }, 'us-east-1', () => new Date());

    await expect(adapter.list?.()).rejects.toMatchObject({ code: 'RESULT_LIMIT' });
  });

  it('fails closed when a pagination token remains after page 50', async () => {
    let calls = 0;
    const adapter = createEc2Adapter({
      describeInstances: async () => {
        calls += 1;
        return { nextToken: `page-${calls + 1}` };
      },
    }, 'us-east-1', () => new Date());

    await expect(adapter.list?.()).rejects.toMatchObject({ code: 'RESULT_LIMIT' });
    expect(calls).toBe(50);
  });
});
