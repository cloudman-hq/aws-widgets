import * as AWS from 'aws-sdk';

type BucketName = string;

const s3 = new AWS.S3();

export async function s3GetIsPublic(bucketName: BucketName): Promise<string> {
  return s3.getBucketPolicyStatus({ Bucket: bucketName })
      .promise()
      .then(
          (value) => {
            return value.PolicyStatus.IsPublic.toString();
          },
          (error: AWS.AWSError) => {
            return `Property can not be loaded:${error.message}`;
          });
}
