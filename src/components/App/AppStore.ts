import { observable, action, computed } from 'mobx';

class AppStore {
  @observable appName = '';
  @observable tags = '';
  @observable resourceId = '';
  @observable resourceType = '';
  @observable region = '';

  @observable resourceDescription = {};
  private rootStore: any;
  constructor(rootStore: any) {
    this.rootStore = rootStore;
  }

  @computed get isRegionAndResourceSetup() {
    return this.region.length > 0 && this.resourceId.length > 0;
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

  @action public setRegion(region: string) {
    this.region = region;
  }
}
export default AppStore;
