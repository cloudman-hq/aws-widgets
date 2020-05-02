import { observable, computed, action } from 'mobx';
import { BehaviorSubject } from 'rxjs';
import * as AWS from 'aws-sdk';

const subscribers: any = {
  accessKey$: new BehaviorSubject(''),
  secretKey$: new BehaviorSubject(''),
};

class SettingsStore {
  private rootStore: any;
  constructor(rootStore: any) {
    this.rootStore = rootStore;
    subscribers.accessKey$.subscribe((value: string) => {
      this.setAccessKey(value);
    });
    subscribers.secretKey$.subscribe((value: string) => {
      this.setSecretKey(value);
    });
  }

  @observable accessKey = '';
  @observable secretKey = '';
  @computed get isAccessSetup() {
    return this.accessKey.length > 0 && this.secretKey.length > 0;
  }
  @computed get toJson() {
    return {
      accessKey: this.accessKey,
      secretKey: this.secretKey,
    };
  }
  @action setAccessKey = (accessKey: string) => {
    this.accessKey = accessKey;
  }
  @action setSecretKey = (secretKey: string) => {
    this.secretKey = secretKey;
  }

  public verifyCredentials = () => {
    return new Promise((resolve, reject) => {
      AWS.config.credentials = new AWS.Credentials(this.accessKey, this.secretKey);

      const sts = new AWS.STS();
      sts.getCallerIdentity({}, (err, data) => {
        if (err) {
          reject({ code: 'INCORRECT', content: err });
        } else {
          resolve(data);
        }
      });
    });
  }

  @action public saveSettings = () => {
    return new Promise(
      (resolve, reject) => {
        if (!(window as any).AP) {
          reject('AP is not defined. This method can only run on a Confluence page.');
        } else {
          // tslint:disable-next-line: no-console
          console.log('Saving credentials.');
          // eslint-disable-next-line no-undef
          (window as any).AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials', {
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ accessKey: this.accessKey, secretKey: this.secretKey }),
            success: (response: any) => {
              // tslint:disable-next-line: no-console
              console.log(response);
              resolve(response);
            },
            error: (error: any) => {
              // tslint:disable-next-line: no-console
              console.log(error);
              reject(error);
            },
          });

        }
      },
    );
  }

  @computed get awsCredentials() {
    if (!this.isAccessSetup) {
      return null;
    }
    return new AWS.Credentials(
      this.accessKey,
      this.secretKey,
    )
  }
}

export { subscribers, SettingsStore };
