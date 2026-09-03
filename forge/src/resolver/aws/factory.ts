import {
  DescribeInstancesCommand,
  EC2Client,
  type DescribeInstancesCommandOutput,
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  ECSClient,
  type DescribeClustersCommandOutput,
} from '@aws-sdk/client-ecs';
import {
  GetFunctionCommand,
  LambdaClient,
  ListTagsCommand,
  type GetFunctionCommandOutput,
  type ListTagsCommandOutput,
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketPolicyStatusCommand,
  GetBucketTaggingCommand,
  S3Client,
  type GetBucketEncryptionCommandOutput,
  type GetBucketLifecycleConfigurationCommandOutput,
  type GetBucketPolicyStatusCommandOutput,
  type GetBucketTaggingCommandOutput,
} from '@aws-sdk/client-s3';
import {
  DescribeTableCommand,
  DynamoDBClient,
  type DescribeTableCommandOutput,
} from '@aws-sdk/client-dynamodb';
import type { ResourceType, SupportedRegion } from '../../shared/contracts';
import type { StoredCredentialV1 } from '../credentials/repository';
import type { ResourceAdapter } from '../resources/types';
import { createDynamoDbAdapter } from './dynamodb';
import { createEc2Adapter } from './ec2';
import { createEcsAdapter } from './ecs';
import { createLambdaAdapter } from './lambda';
import { createS3Adapter } from './s3';

type SendClient = {
  send(command: object, options: { abortSignal: AbortSignal }): Promise<unknown>;
  destroy(): void;
};

const sendBounded = async <T>(client: SendClient, command: object): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    return await client.send(command, { abortSignal: controller.signal }) as T;
  } finally {
    clearTimeout(timeout);
  }
};

const clientConfig = (region: SupportedRegion, credential: StoredCredentialV1) => ({
  region,
  credentials: {
    accessKeyId: credential.accessKeyId,
    secretAccessKey: credential.secretAccessKey,
  },
  maxAttempts: 2,
});

const disposable = (adapter: ResourceAdapter, client: SendClient): ResourceAdapter => ({
  ...adapter,
  dispose: () => client.destroy(),
});

export const createAwsResourceAdapter = (
  resourceType: ResourceType,
  region: SupportedRegion,
  credential: StoredCredentialV1,
  now: () => Date = () => new Date(),
): ResourceAdapter => {
  const config = clientConfig(region, credential);

  if (resourceType === 'ec2') {
    const client = new EC2Client(config);
    return disposable(createEc2Adapter({
      describeInstances: async (input) => {
        const output = await sendBounded<DescribeInstancesCommandOutput>(
          client,
          new DescribeInstancesCommand({ InstanceIds: input.instanceIds }),
        );
        return {
          reservations: output.Reservations?.map((reservation) => ({
            instances: reservation.Instances?.map((instance) => ({
              instanceId: instance.InstanceId,
              state: { name: instance.State?.Name },
              instanceType: instance.InstanceType,
              rootDeviceType: instance.RootDeviceType,
              placement: { availabilityZone: instance.Placement?.AvailabilityZone },
              keyName: instance.KeyName,
              iamInstanceProfile: { arn: instance.IamInstanceProfile?.Arn },
              securityGroups: instance.SecurityGroups?.map((group) => ({ groupName: group.GroupName })),
              privateIpAddress: instance.PrivateIpAddress,
              publicDnsName: instance.PublicDnsName,
              tags: instance.Tags?.map((tag) => ({ key: tag.Key, value: tag.Value })),
            })),
          })),
        };
      },
    }, region, now), client);
  }

  if (resourceType === 'lambda') {
    const client = new LambdaClient(config);
    return disposable(createLambdaAdapter({
      getFunction: async ({ functionName }) => {
        const output = await sendBounded<GetFunctionCommandOutput>(
          client,
          new GetFunctionCommand({ FunctionName: functionName }),
        );
        return {
          configuration: output.Configuration && {
            functionName: output.Configuration.FunctionName,
            functionArn: output.Configuration.FunctionArn,
            runtime: output.Configuration.Runtime,
            role: output.Configuration.Role,
            lastUpdateStatus: output.Configuration.LastUpdateStatus,
          },
        };
      },
      listTags: async ({ resource }) => {
        const output = await sendBounded<ListTagsCommandOutput>(
          client,
          new ListTagsCommand({ Resource: resource }),
        );
        return { tags: output.Tags };
      },
    }, region, now), client);
  }

  if (resourceType === 'ecs') {
    const client = new ECSClient(config);
    return disposable(createEcsAdapter({
      describeClusters: async ({ clusters }) => {
        const output = await sendBounded<DescribeClustersCommandOutput>(
          client,
          new DescribeClustersCommand({ clusters }),
        );
        return {
          clusters: output.clusters?.map((cluster) => ({
            clusterArn: cluster.clusterArn,
            clusterName: cluster.clusterName,
            status: cluster.status,
          })),
          failures: output.failures,
        };
      },
    }, region, now), client);
  }

  if (resourceType === 'dynamodb') {
    const client = new DynamoDBClient(config);
    return disposable(createDynamoDbAdapter({
      describeTable: async ({ tableName }) => {
        const output = await sendBounded<DescribeTableCommandOutput>(
          client,
          new DescribeTableCommand({ TableName: tableName }),
        );
        return {
          table: output.Table && {
            tableName: output.Table.TableName,
            tableStatus: output.Table.TableStatus,
            itemCount: output.Table.ItemCount,
          },
        };
      },
    }, region, now), client);
  }

  const client = new S3Client(config);
  const send = <T>(command: object) => sendBounded<T>(client, command);
  return disposable(createS3Adapter({
    getBucketPolicyStatus: async ({ bucket }) => {
      const output = await send<GetBucketPolicyStatusCommandOutput>(
        new GetBucketPolicyStatusCommand({ Bucket: bucket }),
      );
      return { policyStatus: { isPublic: output.PolicyStatus?.IsPublic } };
    },
    getBucketEncryption: async ({ bucket }) => {
      const output = await send<GetBucketEncryptionCommandOutput>(
        new GetBucketEncryptionCommand({ Bucket: bucket }),
      );
      return {
        rules: output.ServerSideEncryptionConfiguration?.Rules?.map((rule) => ({
          algorithm: rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm,
        })),
      };
    },
    getBucketLifecycleConfiguration: async ({ bucket }) => {
      const output = await send<GetBucketLifecycleConfigurationCommandOutput>(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }),
      );
      return { rules: output.Rules?.map((rule) => ({ id: rule.ID })) };
    },
    getBucketTagging: async ({ bucket }) => {
      const output = await send<GetBucketTaggingCommandOutput>(
        new GetBucketTaggingCommand({ Bucket: bucket }),
      );
      return { tagSet: output.TagSet?.map((tag) => ({ key: tag.Key, value: tag.Value })) };
    },
  }, region, now), client);
};
