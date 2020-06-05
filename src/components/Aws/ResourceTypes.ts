import * as AWS from 'aws-sdk';

const resourceTypes =
  [
    {
      name: 'EC2',
      list: (region: string, credentials: any) => new Promise((resolv, reject) => {
        AWS.config.credentials = credentials;
        AWS.config.region = region;
        const ec2 = new AWS.EC2();

        ec2.describeInstances({}, (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            const instances = data.Reservations.flatMap((r: any) =>
              r.Instances.map((i: any) => ({ label: i.PrivateIpAddress, value: i.InstanceId })));
            resolv(instances);
          }
        });
      }),
      properties: (resourceId: string) => new Promise((resolv, reject) => {
        const params = { InstanceIds: [resourceId] };
        new AWS.EC2().describeInstances(params, (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            const instance: any = data.Reservations[0].Instances[0];
            const instanceState = instance.State.Name;
            const availabilityZone = instance.Placement.AvailabilityZone;
            const securityGroups = instance.SecurityGroups
              && instance.SecurityGroups.map((g: any) => g.GroupName) || [];
            resolv({
              Name: resourceId,
              State: instanceState,
              Type: instance.InstanceType,
              Storage: instance.RootDeviceType,
              AZ: availabilityZone,
              Key: instance.KeyName,
              IAM: instance.IamInstanceProfile && instance.IamInstanceProfile.Arn,
              SGs: securityGroups,
              PrivateIp: instance.PrivateIpAddress,
              PublicDns: instance.PublicDnsName,
              Tags: instance.Tags && instance.Tags.map((t: any) => `${t.Key}: ${t.Value}`),
            });
          }
        });
      }),
    },
    {
      name: 'Lambda',
      list: (region: string, credentials: any) => new Promise((resolv, reject) => {
        AWS.config.credentials = credentials;
        AWS.config.region = region;
        const lambda = new AWS.Lambda();

        lambda.listFunctions({}, (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            resolv(data.Functions.map((f: any) =>
              ({ label: f.FunctionName, value: f.FunctionArn })));
          }
        });
      }),
      properties: (resourceId: string) => new Promise((resolv, reject) => resolv({})),
    },
    // { name: 'S3', list: () => new Promise(() => { }) },
    {
      name: 'ECS',
      list: (region: string, credentials: any) => new Promise((resolv, reject) => {
        AWS.config.credentials = credentials;
        AWS.config.region = region;
        new AWS.ECS().listClusters({}, (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            resolv(data.clusterArns.map((c: any) =>
              ({ label: c, value: c })));
          }
        });
      }),
      properties: (resourceId: string) => new Promise((resolv, reject) => {
        new AWS.ECS().describeClusters({ clusters: [resourceId] }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolv(data.clusters.length && {
              Name: data.clusters[0].clusterName,
              Status: data.clusters[0].status,
            } || {});
          }
        });
      }),
    },
    {
      name: 'Dynamodb',
      list: (region: string, credentials: any) =>
        new Promise((resolv, reject) => {
          AWS.config.credentials = credentials;
          AWS.config.region = region;
          new AWS.DynamoDB().listTables({}, (err: any, data: any) => {
            if (err) {
              reject(err);
            } else {
              resolv(data.TableNames.map((t: any) =>
                ({ label: t, value: t })));
            }
          });
        }),
      properties: (resourceId: string) => new Promise((resolv, reject) => resolv({})),
    },
  ];

export const findByName = (name: string) => resourceTypes.find(t => t.name === name);

export default resourceTypes;
