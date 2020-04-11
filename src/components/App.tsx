import * as React from 'react';
import Settings from './Settings';
import Route from './Route';
import { inject, observer } from 'mobx-react';

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
    this.loadSettings();
  }

  loadSettings = () => {
    this.settingsStore.setAccessKey('loaded-accesskey');
    this.settingsStore.setSecretKey('loaded-secretkey');
    // eslint-disable-next-line no-undef
    if ((window as any).AP) {
      // eslint-disable-next-line no-undef
      (window as any).AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials?jsonValue=true', {
        success: (response: any) => {
          // tslint:disable-next-line: no-console
          console.log(response);
          this.settingsStore.accessKey = response.value.accessKey;
          this.settingsStore.secretKey = response.value.second;
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
    const { appStore } = this.props;
    const { appName } = appStore;
    return <>
      <h1>{appName}</h1>
      <Route />
      <button onClick={() => appStore.setAppName('abc')}>SetName</button>
    </>;
  }
}

export default App;
