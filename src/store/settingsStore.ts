import { observable, computed, action } from 'mobx';
import { BehaviorSubject } from 'rxjs';

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
  @action loadSettings = (e: any) => {
    e.preventDefault();
    if ((window as any).AP) {
      (window as any).AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials?jsonValue=true', {
        success: (response: any) => {
          // tslint:disable-next-line: no-console
          console.log(response);
        },
        error: (error: any) => {
          // tslint:disable-next-line: no-console
          console.log(error);
        },
      });
      // tslint:disable-next-line: no-console
      console.log('Credentials loaded.');
    } else {
      // tslint:disable-next-line: no-console
      console.log('Credentials is not loaded as AP is not defined.');
    }
  }
  @action saveSettings = (e: any) => {
    e.preventDefault();
    // tslint:disable-next-line: no-console
    console.log('Saving credentials.');
    // eslint-disable-next-line no-undef
    if ((window as any).AP) {
      // eslint-disable-next-line no-undef
      (window as any).AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials', {
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ accessKey: this.accessKey, secretKey: this.secretKey }),
        success: (response: any) => {
          // tslint:disable-next-line: no-console
          console.log(response);
        },
        error: (error: any) => {
          // tslint:disable-next-line: no-console
          console.log(error);
        },
      });
      // tslint:disable-next-line: no-console
      console.log('Credentials saved.');
    } else {
      // tslint:disable-next-line: no-console
      console.log('Credentials is not saved as AP is not defined.');
    }
  }
}

export { subscribers, SettingsStore };
