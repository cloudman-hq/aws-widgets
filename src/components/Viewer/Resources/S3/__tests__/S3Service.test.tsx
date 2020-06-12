import { S3Service } from '../S3Service';
import * as AWSMock from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';
import { GetBucketPolicyStatusRequest } from 'aws-sdk/clients/s3';

beforeAll(async (done) => {
  // get requires env vars
  done();
});
describe('S3Service', () => {
  it('should return isPublic', async () => {
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock(
      'S3',
      'getBucketPolicyStatus',
      (params: GetBucketPolicyStatusRequest, callback: (err: any, data: any) => void) => {
        return callback(null, { PolicyStatus: { IsPublic: true } });
      });
    const s3Service = new S3Service();
    const s: string = await s3Service.s3GetIsPublic('bucketName');
    expect(s).toBe('true');

    AWSMock.restore('S3');
  });
  it('should return s3GetIsEncrypted', async () => {
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock(
      'S3',
      'getBucketEncryption',
      (params: GetBucketPolicyStatusRequest, callback: (err: any, data: any) => void) => {
        return callback(null, {
          ServerSideEncryptionConfiguration: {
            Rules: [
              {
                ApplyServerSideEncryptionByDefault: {
                  SSEAlgorithm: '',
                },
              },
            ],
          },
        });
      });
    const s3Service = new S3Service();
    const s: string = await s3Service.s3GetIsEncrypted('bucketName');
    expect(s).toBe('false');

    AWSMock.restore('S3');
  });
  it('should return s3GetBucketLifecycleConfiguration', async () => {
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock(
      'S3',
      'getBucketLifecycleConfiguration',
      (params: GetBucketPolicyStatusRequest, callback: (err: any, data: any) => void) => {
        return callback(null, {
          Rules: [{ ID: 'ID1' }, { ID: 'ID2' }],
        });
      });
    const s3Service = new S3Service();
    const s: string[] = await s3Service.s3GetBucketLifecycleConfiguration('bucketName');
    expect(s).toStrictEqual(['ID1', 'ID2']);

    AWSMock.restore('S3');
  });
});
