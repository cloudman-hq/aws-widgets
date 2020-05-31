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
    // { name: 'Lambda', list: () => new Promise(() => { }) },
    // { name: 'S3', list: () => new Promise(() => { }) },
    // { name: 'ECS', list: () => new Promise(() => { }) },
    // { name: 'Dynamodb', list: () => new Promise(() => { }) },
  ];
