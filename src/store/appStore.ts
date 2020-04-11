import { observable, action } from 'mobx';

class AppStore {
  @observable appName = '';
  @observable resourceId = '';

  private rootStore: any;
  constructor(rootStore: any) {
    this.rootStore = rootStore;
  }
  @action public setAppName(name: string) {
    this.appName = name;
  }

  @action public setResourceId(id: string) {
    this.resourceId = id;
  }
}
export default AppStore;
