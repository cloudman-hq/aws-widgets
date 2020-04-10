import SettingsStore from './settingsStore';
import AppStore from './appStore';

export default class RootStore {
  private settingsStore: any;
  private appStore: any;

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
