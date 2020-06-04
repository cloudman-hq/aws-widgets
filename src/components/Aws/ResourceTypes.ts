import * as AWS from 'aws-sdk';
export default
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
    },
    {
      name: 'Lambda', list: (region: string, credentials: any) => new Promise((resolv, reject) => {
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
    },
    // { name: 'S3', list: () => new Promise(() => { }) },
    {
      name: 'ECS', list: (region: string, credentials: any) => new Promise((resolv, reject) => {
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
    },
    {
      name: 'Dynamodb', list: (region: string, credentials: any) =>
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
    },
  ];
