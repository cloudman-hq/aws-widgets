import { S3 } from 'aws-sdk';

type BucketName = string;

export class S3Service {
  private s3: S3;

  constructor() {
    this.s3 = new S3();
  }

  async s3GetIsPublic(bucketName: BucketName): Promise<string> {
    return this.s3.getBucketPolicyStatus({ Bucket: bucketName })
      .promise()
      .then(
        (value) => {
          return value.PolicyStatus.IsPublic.toString();
        },
        (error: AWS.AWSError) => {
          return `Property can not be loaded:${error.message}`;
        });
  }

  async s3GetIsEncrypted(bucketName: BucketName): Promise<string> {
    return this.s3.getBucketEncryption({ Bucket: bucketName })
      .promise()
      .then(
        (value) => {
          const defaultAlgorithm = value
            .ServerSideEncryptionConfiguration
            .Rules[0]
            .ApplyServerSideEncryptionByDefault
            .SSEAlgorithm;
          return ('' !== defaultAlgorithm).toString();
        },
        (error: AWS.AWSError) => {
          return `Property can not be loaded:${error.message}`;
        });
  }
}
