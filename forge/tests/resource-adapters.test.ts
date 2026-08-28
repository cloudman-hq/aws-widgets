import { describe, expect, it, vi } from 'vitest';
import { createDynamoDbAdapter } from '../src/resolver/aws/dynamodb.js';
import { createEcsAdapter } from '../src/resolver/aws/ecs.js';
import { mapAwsError } from '../src/resolver/aws/errors.js';
import { createLambdaAdapter } from '../src/resolver/aws/lambda.js';
import { createS3Adapter } from '../src/resolver/aws/s3.js';

const NOW = () => new Date('2026-08-28T00:00:00.000Z');

describe('Lambda adapter', () => {
  it('paginates lists and normalizes describe output', async () => {
    const listFunctions = vi.fn(async ({ marker }: { marker?: string }) => marker
      ? { functions: [{ functionName: 'alpha', functionArn: 'arn:alpha' }] }
      : { functions: [{ functionName: 'zeta', functionArn: 'arn:zeta' }], nextMarker: 'next' });
    const adapter = createLambdaAdapter({
      listFunctions,
      getFunction: async () => ({ configuration: {
        functionName: 'alpha',
        functionArn: 'arn:aws:lambda:us-east-1:000000000000:function:alpha',
        runtime: 'nodejs24.x',
        role: 'arn:aws:iam::000000000000:role/lambda',
        lastUpdateStatus: 'Successful',
        unapproved: 'raw',
      } as never }),
      listTags: async () => ({ tags: { Team: 'Platform' } }),
    }, 'us-east-1', NOW);

    await expect(adapter.list?.()).resolves.toEqual({
      items: [
        { id: 'arn:alpha', label: 'alpha' },
        { id: 'arn:zeta', label: 'zeta' },
      ],
      truncated: false,
    });
    const view = await adapter.describe('alpha');
    expect(view.fields.map((field) => field.key)).toEqual([
      'functionName', 'runtime', 'executionRoleArn', 'lastUpdateStatus', 'tags',
    ]);
    expect(JSON.stringify(view)).not.toContain('unapproved');
  });
});

describe('ECS adapter', () => {
  it('maps service failures/empty clusters to NOT_FOUND', async () => {
    const adapter = createEcsAdapter({
      listClusters: async () => ({ clusterArns: [] }),
      describeClusters: async () => ({ failures: [{ reason: 'MISSING' }] }),
    }, 'us-east-1', NOW);
    await expect(adapter.describe('cluster')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns only cluster name and status', async () => {
    const adapter = createEcsAdapter({
      listClusters: async () => ({ clusterArns: [] }),
      describeClusters: async () => ({
        clusters: [{ clusterName: 'main', status: 'ACTIVE', clusterArn: 'secret-ish-raw-arn' }],
      }),
    }, 'us-east-1', NOW);
    const view = await adapter.describe('main');
    expect(view.fields).toEqual([
      { key: 'clusterName', label: 'Cluster name', value: 'main' },
      { key: 'status', label: 'Status', value: 'ACTIVE' },
    ]);
    expect(JSON.stringify(view)).not.toContain('secret-ish-raw-arn');
  });
});

describe('DynamoDB adapter', () => {
  it('normalizes the table view and treats empty output as missing', async () => {
    const adapter = createDynamoDbAdapter({
      listTables: async () => ({ tableNames: ['zeta', 'alpha'] }),
      describeTable: async () => ({ table: {
        tableName: 'alpha', tableStatus: 'ACTIVE', itemCount: 42, billingMode: 'raw',
      } as never }),
    }, 'us-east-1', NOW);
    await expect(adapter.list?.()).resolves.toMatchObject({
      items: [{ id: 'alpha', label: 'alpha' }, { id: 'zeta', label: 'zeta' }],
    });
    const view = await adapter.describe('alpha');
    expect(view.fields.map((field) => field.key)).toEqual(['tableName', 'tableStatus', 'itemCount']);
    expect(JSON.stringify(view)).not.toContain('billingMode');
  });
});

describe('S3 adapter', () => {
  it('omits a denied auxiliary field and never returns raw policy data', async () => {
    const adapter = createS3Adapter({
      getBucketPolicyStatus: async () => ({ policyStatus: { isPublic: false }, rawPolicy: 'raw-json' } as never),
      getBucketEncryption: async () => { throw Object.assign(new Error('raw denial'), { name: 'AccessDenied' }); },
      getBucketLifecycleConfiguration: async () => ({ rules: [{ id: 'expire' }] }),
      getBucketTagging: async () => ({ tagSet: [{ key: 'Team', value: 'Platform' }] }),
    }, 'us-east-1', NOW);
    const view = await adapter.describe('example-bucket');
    expect(view.fields.map((field) => field.key)).toEqual([
      'bucketName', 'publicPolicy', 'lifecycleRuleIds', 'tags',
    ]);
    expect(JSON.stringify(view)).not.toContain('raw-json');
    expect(JSON.stringify(view)).not.toContain('raw denial');
  });

  it('maps bucket absence and total permission failure to stable codes', async () => {
    const absent = Object.assign(new Error('raw'), { name: 'NoSuchBucket' });
    const denied = Object.assign(new Error('raw'), { name: 'AccessDenied' });
    const make = (failure: Error) => createS3Adapter({
      getBucketPolicyStatus: async () => { throw failure; },
      getBucketEncryption: async () => { throw failure; },
      getBucketLifecycleConfiguration: async () => { throw failure; },
      getBucketTagging: async () => { throw failure; },
    }, 'us-east-1', NOW);
    await expect(make(absent).describe('missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(make(denied).describe('denied')).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
  });
});

describe('AWS error mapper', () => {
  it.each([
    ['InvalidClientTokenId', 'INVALID_AUTH', false],
    ['AccessDeniedException', 'PERMISSION_DENIED', false],
    ['ResourceNotFoundException', 'NOT_FOUND', false],
    ['ThrottlingException', 'THROTTLED', true],
    ['AbortError', 'NETWORK_ERROR', true],
    ['UnknownRawAwsFailure', 'INTERNAL_ERROR', true],
  ])('maps %s without preserving raw data', (name, code, retryable) => {
    const mapped = mapAwsError(Object.assign(new Error('raw payload and aws request id'), { name }));
    expect(mapped).toMatchObject({ code, retryable, message: code });
    expect(JSON.stringify(mapped)).not.toContain('raw payload');
  });
});
