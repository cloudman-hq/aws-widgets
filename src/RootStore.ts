import { SettingsStore } from './components/Settings/SettingsStore';
import DynamodbStore from './components/Viewer/Resources/DynamoDB/DynamodbStore';
import AppStore from './components/App/AppStore';
import 'mobx-react-lite/batchingForReactDom';
import { from } from 'rxjs';

export default class RootStore {
  private readonly settingsStore: SettingsStore;
  private readonly dynamodbStore: DynamodbStore;
  private readonly appStore: AppStore;

  constructor() {
    this.settingsStore = new SettingsStore();
    this.appStore = new AppStore();
    this.dynamodbStore = new DynamodbStore();
  }

  public getSettingsStore(): SettingsStore {
    return this.settingsStore;
  }

  public getAppStore(): AppStore {
    return this.appStore;
  }

  public getDynamodbStore(): DynamodbStore {
    return this.dynamodbStore;
  }
}
