import { SettingsStore } from './components/Settings/SettingsStore';
import AppStore from './components/App/AppStore';
import 'mobx-react-lite/batchingForReactDom';

export default class RootStore {
  private readonly settingsStore: SettingsStore;
  private readonly appStore: AppStore;

  constructor() {
    this.settingsStore = new SettingsStore(this);
    this.appStore = new AppStore(this);
  }

  public getSettingsStore(): any {
    return this.settingsStore;
  }

  public getAppStore(): any {
    return this.appStore;
  }
}
