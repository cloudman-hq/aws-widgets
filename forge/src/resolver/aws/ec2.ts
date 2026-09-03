import type { ResourceAdapter } from '../resources/types';
import type { SupportedRegion } from '../../shared/contracts';
import { PublicResolverError } from '../errors';
import { mapAwsError } from './errors';
import {
  definedFields,
  formatTags,
  makeField,
  safeString,
} from './common';

export type Ec2Instance = {
  instanceId?: unknown | undefined;
  state?: { name?: unknown | undefined } | undefined;
  instanceType?: unknown | undefined;
  rootDeviceType?: unknown | undefined;
  placement?: { availabilityZone?: unknown | undefined } | undefined;
  keyName?: unknown | undefined;
  iamInstanceProfile?: { arn?: unknown | undefined } | undefined;
  securityGroups?: Array<{ groupName?: unknown | undefined }> | undefined;
  privateIpAddress?: unknown | undefined;
  publicDnsName?: unknown | undefined;
  tags?: Array<{ key?: unknown | undefined; value?: unknown | undefined }> | undefined;
};

export type Ec2Page = {
  reservations?: Array<{ instances?: Ec2Instance[] | undefined }> | undefined;
};

export type Ec2Api = {
  describeInstances(input: { instanceIds: string[] }): Promise<Ec2Page>;
};

export const createEc2Adapter = (
  api: Ec2Api,
  region: SupportedRegion,
  now: () => Date,
): ResourceAdapter => ({
  describe: async (resourceId) => {
    try {
      const page = await api.describeInstances({ instanceIds: [resourceId] });
      const instance = page.reservations?.flatMap((reservation) => reservation.instances ?? [])[0];
      if (!instance) throw new PublicResolverError('NOT_FOUND');
      const tags = formatTags(instance.tags);
      const name = instance.tags
        ?.find((tag) => tag.key === 'Name')
        ?.value;
      const securityGroups = (instance.securityGroups ?? [])
        .flatMap((group) => safeString(group.groupName, 256) ?? [])
        .slice(0, 50)
        .sort();
      return {
        schemaVersion: 1,
        resourceType: 'ec2',
        resourceId,
        region,
        title: safeString(name, 256) ?? resourceId,
        fields: definedFields([
          makeField('instanceId', 'Instance ID', resourceId),
          makeField('state', 'State', safeString(instance.state?.name, 64)),
          makeField('instanceType', 'Instance type', safeString(instance.instanceType, 64)),
          makeField('rootDeviceType', 'Root device type', safeString(instance.rootDeviceType, 64)),
          makeField('availabilityZone', 'Availability zone', safeString(instance.placement?.availabilityZone, 64)),
          makeField('keyName', 'Key name', safeString(instance.keyName, 256)),
          makeField('iamInstanceProfileArn', 'IAM instance profile', safeString(instance.iamInstanceProfile?.arn, 512)),
          makeField('securityGroups', 'Security groups', securityGroups),
          makeField('privateIpAddress', 'Private IP', safeString(instance.privateIpAddress, 64)),
          makeField('publicDnsName', 'Public DNS', safeString(instance.publicDnsName, 256)),
          makeField('tags', 'Tags', tags),
        ]),
        observedAt: now().toISOString(),
      };
    } catch (error: unknown) {
      if (error instanceof PublicResolverError) throw error;
      throw mapAwsError(error);
    }
  },
});
