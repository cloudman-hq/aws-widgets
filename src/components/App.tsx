import * as React from 'react';
import Route from './Route';
import { inject, observer } from 'mobx-react';
import { Switch, withRouter } from 'react-router-dom';

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
    this.loadMacroDataAndMacroBody();
  }

  private loadSettings = () => {
    // eslint-disable-next-line no-undef
    if ((window as any).AP) {
      // eslint-disable-next-line no-undef
      (window as any).AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials?jsonValue=true', {
        success: (response: any) => {
          const jsonResponse = JSON.parse(response);
          this.settingsStore.accessKey = jsonResponse.value.accessKey;
          this.settingsStore.secretKey = jsonResponse.value.secretKey;
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

  private loadMacroDataAndMacroBody = () => {
    if ((window as any).AP) {
      (window as any).AP.confluence.getMacroBody(function (body: string) {
        this.appStore.setResourceId(body);
      });
    }
  };

  public render() {
    const { location } = this.props;
    return <>
      <Switch location={location}>
        <Route />
      </Switch>
      <footer>This is the App component: 202004121304</footer>
    </>;
  }
}

export default withRouter(App);
