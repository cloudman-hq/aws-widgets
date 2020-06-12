import { SettingsStore } from './components/Settings/SettingsStore';
import AppStore from './components/App/AppStore';
import 'mobx-react-lite/batchingForReactDom';

export default class RootStore {
  private readonly settingsStore: SettingsStore;
  private readonly appStore: AppStore;

  constructor() {
    this.settingsStore = new SettingsStore();
    this.appStore = new AppStore();
  }

  public getSettingsStore(): SettingsStore {
    return this.settingsStore;
  }

  public getAppStore(): AppStore {
    return this.appStore;
  }
}
