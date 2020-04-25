import { SettingsStore } from './components/Settings/SettingsStore';
import AppStore from './components/App/AppStore';
import 'mobx-react-lite/batchingForReactDom';
import { LambdaStore } from './components/Lambda/LambdaStore';

export default class RootStore {
  private settingsStore: any;
  private appStore: any;
  private lambdaStore: any;

  constructor() {
    this.appStore = new AppStore(this);
    this.settingsStore = new SettingsStore(this);
    this.lambdaStore = new LambdaStore(this);
  }

  public getSettingsStore(): any {
    return this.settingsStore;
  }

  public getAppStore(): any {
    return this.appStore;
  }

  public getLambdaStore(): any {
    return this.lambdaStore;
  }
}
