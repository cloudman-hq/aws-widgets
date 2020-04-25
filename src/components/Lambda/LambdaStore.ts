import { observable, action } from 'mobx';
import * as AWS from 'aws-sdk';
import { ListTagsRequest } from 'aws-sdk/clients/lambda';

interface LambdaDescription {
  lambdaName?: string;
  lambdaRuntime?: string;
  lambdaRole?: string;
  lastUpdateStatus?: string;
  availabilityZone?: string;
  resourceState?: string;
}

class LambdaStore {
  private appStore: any;
  private lambda: any;

  @observable isLoading = true;
  @observable error = {
    isError: false,
    msg: '',
  };
  @observable tags = {};
  @observable lambdaDescription: LambdaDescription = {
    lambdaName: '',
    lambdaRuntime: '',
    lambdaRole: '',
    lastUpdateStatus: '',
    availabilityZone: '',
    resourceState: '',
  };
  constructor(rootStore: any) {
    this.appStore = rootStore.getAppStore();
    this.lambda = new AWS.Lambda();
  }

  @action getLambda() {
    const { resourceId } = this.appStore;
    if (resourceId.indexOf('arn:aws:lambda') === 0) {
      const params = {
        FunctionName: resourceId,
      };
      this.isLoading = true;
      this.lambda.getFunction(params, (err: any, data: any) => {
        this.isLoading = false;
        if (!err) {
          this.lambdaDescription = {
            lambdaName: data.Configuration.FunctionName,
            lambdaRuntime: data.Configuration.Runtime,
            lambdaRole: data.Configuration.Role,
            lastUpdateStatus: data.Configuration.LastUpdateStatus,
            availabilityZone: '',
            resourceState: '',
          };
          this.tags = { ...data.Tags };
        }
      });
    } else {
      this.isLoading = false;
      this.error.isError = true;
      this.error.msg = 'Error: wrong resource type';
    }
  }
}

export { LambdaStore };
