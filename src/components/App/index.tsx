import * as React from 'react';
import Route from '../Route';
import { inject, observer } from 'mobx-react';
import { autorun } from 'mobx';
import { Switch, withRouter } from 'react-router-dom';
import { decrypt } from './shared';
import { loadMacro } from '../Macro';
import { findByResourceId } from '../Aws/ResourceTypes';

@inject(({ rootStore }) => ({
  appStore: rootStore.getAppStore(),
  settingsStore: rootStore.getSettingsStore(),
}))
@observer
class App extends React.Component<any, any> {
  private settingsStore: any;
  constructor(props: any) {
    super(props);
    // Try to load setting from app.properties
    this.settingsStore = props.settingsStore;
    this.loadSettings = this.loadSettings.bind(this);
    this.loadSettings();

    this.init = this.init.bind(this);
    autorun(this.init);
  }

  async init() {
    const body = await loadMacro();

    if (body) {
      const resourceId = body.resourceId || '';
      const resourceType = body.resourceType || findByResourceId(resourceId)?.name || '';
      const region = body.region || '';
      this.props.appStore.setRegion(region);
      this.props.appStore.setResourceId(resourceId);
      this.props.appStore.setResourceType(resourceType);
    }
  }

  private loadSettings = () => {
    // eslint-disable-next-line no-undef
    if ((window as any).AP) {
      // eslint-disable-next-line no-undef
      (window as any).AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials?jsonValue=true', {
        success: (response: any) => {
          const jsonResponse = JSON.parse(response);
          const credential = decrypt(jsonResponse.value);
          this.props.settingsStore.accessKey = credential.accessKey;
          this.props.settingsStore.secretKey = credential.secretKey;
        },
        error: (error: any) => {
          // tslint:disable-next-line: no-console
          console.log(error);
        },
      });
      // tslint:disable-next-line: no-console
      console.log('Credentials loaded.');
    } else {
      // tslint:disable-next-line: no-console
      console.log('Credentials is not loaded as AP is not defined.');
    }
  }

  public render() {
    const { location } = this.props;
    return <>
      <Switch location={location}>
        <Route />
      </Switch>
    </>;
  }
}

export default withRouter(App);
