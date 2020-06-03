import { AWSError, S3 } from 'aws-sdk';

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
        (error: AWSError) => {
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
        (error: AWSError) => {
          return `Property can not be loaded:${error.message}`;
        });
  }

  async s3GetBucketLifecycleConfiguration(bucketName: BucketName): Promise<string[] | any[]> {
    return this.s3.getBucketLifecycleConfiguration({ Bucket: bucketName })
      .promise()
      .then(
        value => value.Rules.map(rule => rule.ID),
        () => []);
  }

  async s3GetBucketPolicy(bucketName: BucketName): Promise<string> {
    return this.s3.getBucketPolicy({ Bucket: bucketName })
      .promise()
      .then(
        value => value.Policy,
        error => error.message);
  }

  async s3GetBucketTagging(bucketName: BucketName): Promise<Map<string, string>> {
    return this.s3.getBucketTagging({ Bucket: bucketName })
      .promise()
      .then(
        (value) => {
          const map = new Map<string, string>();
          value.TagSet.map((tag) => {
            map.set(tag.Key, tag.Value);
          });
          return map;
        },
        error => new Map<string, string>());
  }
}
