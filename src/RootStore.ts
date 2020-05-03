import { SettingsStore } from './components/Settings/SettingsStore';
import AppStore from './components/App/AppStore';
import 'mobx-react-lite/batchingForReactDom';

export default class RootStore {
  private settingsStore: any;
  private appStore: any;

  constructor() {
    this.settingsStore = new SettingsStore();
    this.appStore = new AppStore(this);
  }

  public getSettingsStore(): any {
    return this.settingsStore;
  }

  public getAppStore(): any {
    return this.appStore;
  }
}
