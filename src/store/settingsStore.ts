import { observable, computed, action } from 'mobx';

class SettingsStore {
  private rootStore: any;
  constructor(rootStore: any) {
    this.rootStore = rootStore;
  }

  @observable accessKey = '';
  @observable secretKey = '';
  @computed get toJson() {
    return {
      accessKey: this.accessKey,
      secretKey: this.secretKey,
    };
  }
  @action setAccessKey(accessKey: string) {
    this.accessKey = accessKey;
  }
  @action setSecretKey(secretKey: string) {
    this.secretKey = secretKey;
  }
}

export default SettingsStore;
