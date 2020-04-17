import { observable, action } from "mobx";

class AppStore {
  @observable appName = "";
  @observable tags = "";
  @observable resourceId = "";
  @observable resourceType = "";
  @observable resourceDescription = {};

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

  @action public setResourceType(type: string) {
    this.resourceType = type;
  }

  @action public setTags(tags: string) {
    this.tags = tags;
  }

  @action public setResourceDescription(desc: any) {
    this.resourceDescription = desc;
  }
}
export default AppStore;
