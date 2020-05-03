import * as React from 'react';
import Route from '../Route';
import { inject, observer } from 'mobx-react';
import { autorun } from 'mobx';
import { Switch, withRouter } from 'react-router-dom';
import { getUrlParam, AP, propertyKey } from './shared';

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
    const uuid = getUrlParam('uuid') || '';
    // tslint:disable-next-line: no-console
    console.log('init uuid:', uuid);

    if (uuid) {
      const key = propertyKey(uuid);
      AP.confluence.getContentProperty(key, (property: any) => {
        // tslint:disable-next-line: no-console
        console.log(`loaded macro body property: ${JSON.stringify(property)}`);
        const resourceId = property && property.value && property.value.resourceId || '';
        const region = property && property.value && property.value.region || '';
        this.props.appStore.setRegion(region);
        this.props.appStore.setResourceId(resourceId);
      });
    }
  }

  private loadSettings = () => {
    // eslint-disable-next-line no-undef
    if ((window as any).AP) {
      // eslint-disable-next-line no-undef
      (window as any).AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials?jsonValue=true', {
        success: (response: any) => {
          const jsonResponse = JSON.parse(response);
          this.props.settingsStore.accessKey = jsonResponse.value.accessKey;
          this.props.settingsStore.secretKey = jsonResponse.value.secretKey;
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
