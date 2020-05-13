import '@testing-library/jest-dom';
import { s3GetIsPublic } from '../S3Service';
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
        const data1 = { PolicyStatus: { IsPublic: true } };
        return callback(null, data1);
      });
    const s: string = await s3GetIsPublic('bucketName');
    expect(s).toBe('true');

    AWSMock.restore('S3');
  });
});
