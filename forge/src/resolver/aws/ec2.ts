import type { ResourceAdapter } from '../resources/types';
import type { SupportedRegion } from '../../shared/contracts';
import { PublicResolverError } from '../errors';
import { mapAwsError } from './errors';
import {
  assertPageWithinLimit,
  definedFields,
  finishOptions,
  formatTags,
  makeField,
  resultLimitIfNeeded,
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
  nextToken?: unknown | undefined;
};

export type Ec2Api = {
  describeInstances(input: { instanceIds?: string[]; nextToken?: string }): Promise<Ec2Page>;
};

export const createEc2Adapter = (
  api: Ec2Api,
  region: SupportedRegion,
  now: () => Date,
): ResourceAdapter => ({
  list: async () => {
    try {
      const items = new Map<string, string>();
      let nextToken: string | undefined;
      for (let pageNumber = 1; ; pageNumber += 1) {
        const page = await api.describeInstances(nextToken ? { nextToken } : {});
        for (const reservation of page.reservations ?? []) {
          for (const instance of reservation.instances ?? []) {
            const id = safeString(instance.instanceId, 64);
            if (!id) continue;
            items.set(id, safeString(instance.privateIpAddress, 64) ?? id);
            resultLimitIfNeeded(items);
          }
        }
        assertPageWithinLimit(pageNumber, page.nextToken);
        nextToken = safeString(page.nextToken, 2048);
        if (!nextToken) return finishOptions(items);
      }
    } catch (error: unknown) {
      if (error instanceof PublicResolverError) throw error;
      throw mapAwsError(error);
    }
  },
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
