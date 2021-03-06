/* tslint:disable*/
import * as AWS from "aws-sdk";
import ec2logo from "./icons/ec2.svg";
import ecslogo from "./icons/ecs.svg";
import dynamodblogo from "./icons/dynamodb.svg";
import s3logo from "./icons/s3.svg";
import lambdalogo from "./icons/lambda.svg";

const s3CorsLink = "https://docs.aws.amazon.com/AmazonS3/latest/dev/cors.html";

function emptyIfRejected<T>(p: Promise<T>) {
  return new Promise<T>((resolv, reject) =>
    p.then(
      (d) => resolv(d),
      (e) => {
        if (e.toString().includes("NetworkingError")) {
          reject(e);
        } else {
          resolv(null);
        }
      }
    )
  );
}

const resourceTypes = [
  {
    name: "EC2",
    keywordInResourceId: "i-",
    icon: ec2logo,
    list: (region: string, credentials: any) =>
      new Promise((resolv, reject) => {
        AWS.config.credentials = credentials;
        AWS.config.region = region;
        const ec2 = new AWS.EC2();

        ec2.describeInstances({}, (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            const instances = data.Reservations.flatMap((r: any) =>
              r.Instances.map((i: any) => ({
                label: i.PrivateIpAddress,
                value: i.InstanceId,
              }))
            );
            resolv(instances);
          }
        });
      }),
    properties: (resourceId: string) =>
      new Promise((resolv, reject) => {
        const params = { InstanceIds: [resourceId] };
        new AWS.EC2().describeInstances(params, (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            const convert = (instance: any) => {
              const instanceState = instance.State.Name;
              const availabilityZone = instance.Placement.AvailabilityZone;
              const securityGroups =
                (instance.SecurityGroups &&
                  instance.SecurityGroups.map((g: any) => g.GroupName)) ||
                [];
              return {
                Name: resourceId,
                State: instanceState,
                Type: instance.InstanceType,
                Storage: instance.RootDeviceType,
                AZ: availabilityZone,
                Key: instance.KeyName,
                IAM:
                  instance.IamInstanceProfile &&
                  instance.IamInstanceProfile.Arn,
                SGs: securityGroups.join(", "),
                PrivateIp: instance.PrivateIpAddress,
                PublicDns: instance.PublicDnsName,
                Tags:
                  instance.Tags &&
                  instance.Tags.map((t: any) => `${t.Key}: ${t.Value}`),
              };
            };
            resolv(
              (data.Reservations.length &&
                convert(data.Reservations[0].Instances[0])) ||
                {}
            );
          }
        });
      }),
  },
  {
    name: "Lambda",
    keywordInResourceId: "arn:aws:lambda",
    icon: lambdalogo,
    list: (region: string, credentials: any) =>
      new Promise((resolv, reject) => {
        AWS.config.credentials = credentials;
        AWS.config.region = region;
        const lambda = new AWS.Lambda();

        lambda.listFunctions({}, (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            resolv(
              data.Functions.map((f: any) => ({
                label: f.FunctionName,
                value: f.FunctionArn,
              }))
            );
          }
        });
      }),
    properties: (resourceId: string) =>
      new Promise(async (resolv, reject) => {
        try {
          const lambda = new AWS.Lambda();
          let configuration: any;
          let tags: any;
          await Promise.all([
            lambda
              .getFunction({ FunctionName: resourceId })
              .promise()
              .then((d) => (configuration = d.Configuration)),
            lambda
              .listTags({ Resource: resourceId })
              .promise()
              .then((d) => (tags = d.Tags)),
          ]);
          resolv({
            Name: configuration.FunctionName,
            Role: configuration.Role,
            Runtime: configuration.Runtime,
            Tags: Object.keys(tags).map((key) => `${key}: ${tags[key]}`),
          });
        } catch (e) {
          reject(e);
        }
      }),
  },
  {
    name: "S3",
    icon: s3logo,
    properties: (resourceId: string) =>
      new Promise(async (resolv, reject) => {
        const s3 = new AWS.S3();
        const param = { Bucket: resourceId };
        try {
          const [policy, encryption, tagging] = await Promise.all([
            emptyIfRejected(s3.getBucketPolicyStatus(param).promise()),
            emptyIfRejected(s3.getBucketEncryption(param).promise()),
            emptyIfRejected(s3.getBucketTagging(param).promise()),
          ]);
          resolv({
            Bucket: resourceId,
            IsPublic:
              (policy && policy.PolicyStatus?.IsPublic.toString()) || "false",
            Encrypted:
              (encryption &&
                encryption.ServerSideEncryptionConfiguration.Rules[0]
                  .ApplyServerSideEncryptionByDefault.SSEAlgorithm) ||
              "false",
            Tags: tagging && tagging.TagSet.map((t) => `${t.Key}: ${t.Value}`),
          });
        } catch (err) {
          resolv({
            html: `Bucket "${resourceId}" not exist or
              <a target="_blank" href="${s3CorsLink}">CORS not enabled</a>`,
          });
        }
      }),
  },
  {
    name: "ECS",
    keywordInResourceId: "arn:aws:",
    icon: ecslogo,
    list: (region: string, credentials: any) =>
      new Promise((resolv, reject) => {
        AWS.config.credentials = credentials;
        AWS.config.region = region;
        new AWS.ECS().listClusters({}, (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            const parseName = (arn: string) => {
              const pos = arn.indexOf("/");
              if (pos + 1 < arn.length) {
                return arn.substring(pos + 1);
              }
              return arn;
            };
            resolv(
              data.clusterArns.map((c: any) => ({
                label: parseName(c),
                value: c,
              }))
            );
          }
        });
      }),
    properties: (resourceId: string) =>
      new Promise(async (resolv, reject) => {
        const ecs = new AWS.ECS();
        const param = { clusters: [resourceId] };
        const params = { cluster: resourceId };
        try {
          const [
            { clusters },
            { taskArns },
            { serviceArns },
          ] = await Promise.all([
            emptyIfRejected(ecs.describeClusters(param).promise()),
            emptyIfRejected(ecs.listTasks(params).promise()),
            emptyIfRejected(ecs.listServices(params).promise()),
          ]);
          resolv({
            Name: clusters.length && clusters[0].clusterName,
            Status: clusters.length && clusters[0].status,
            RunningTasksCount: clusters.length && clusters[0].runningTasksCount,
            PendingTasksCount: clusters.length && clusters[0].pendingTasksCount,
            ActiveServicesCount:
              clusters.length && clusters[0].activeServicesCount,
            Tasks:
              taskArns.length && taskArns.map((task) => task.split("/")[1]),
            Services:
              serviceArns.length &&
              serviceArns.map((service) => service.split("/")[1]),
          });
        } catch (error) {
          console.log(error);
        }
      }),
  },
  {
    name: "Dynamodb",
    keywordInResourceId: "arn:aws:dynamodb",
    icon: dynamodblogo,
    list: (region: string, credentials: any) =>
      new Promise((resolv, reject) => {
        AWS.config.credentials = credentials;
        AWS.config.region = region;
        new AWS.DynamoDB().listTables({}, (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            resolv(data.TableNames.map((t: any) => ({ label: t, value: t })));
          }
        });
      }),
    properties: (resourceId: string) =>
      new Promise((resolv, reject) => {
        new AWS.DynamoDB().describeTable(
          { TableName: resourceId },
          (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolv(
                (data.Table && {
                  Table: resourceId,
                  Items: data.Table.ItemCount,
                }) ||
                  {}
              );
            }
          }
        );
      }),
  },
];

export const findByName = (name: string) =>
  resourceTypes.find((t) => t.name === name);
export const findByResourceId = (resourceId: string) =>
  resourceTypes.find((t) => resourceId.includes(t.keywordInResourceId));

export default resourceTypes;
