import { observable, action } from 'mobx';

class AppStore {
  @observable appName = '';
  private rootStore: any;
  constructor(rootStore: any) {
    this.rootStore = rootStore;
  }
  @action public setAppName(name: string) {
    this.appName = name;
  }
}
export default AppStore;
