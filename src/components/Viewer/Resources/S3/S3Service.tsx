import * as AWS from 'aws-sdk';

type BucketName = string;

const s3 = new AWS.S3();

export function s3GetIsPublic(bucketName: BucketName): Promise<string> {
  const params = {
    Bucket: bucketName,
  };
  return s3.getBucketPolicyStatus(params)
      .promise().then(
          (value) => {
            return value.PolicyStatus.IsPublic.toString();
          },
          (e) => {
            // tslint:disable-next-line: no-console
            console.error(e);
            return 'Property can not be loaded';
          });
}
