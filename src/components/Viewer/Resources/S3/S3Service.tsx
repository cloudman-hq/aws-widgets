import { S3 } from 'aws-sdk';

type BucketName = string;

export async function s3GetIsPublic(bucketName: BucketName): Promise<string> {
  const s3 = new S3();
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
