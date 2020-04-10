import * as React from 'react';
import Settings from './Settings';
import Route from './Route';
import { inject, observer } from 'mobx-react';

@inject(({ rootStore }) => ({
  appStore: rootStore.getAppStore(),
}))
@observer
class App extends React.Component<any, any> {
  public render() {
    const { appStore } = this.props;
    const { appName } = appStore;
    return <>
      <h1>{appName}</h1>
      <Settings />
      <Route />
      <button onClick={() => appStore.setAppName('abc')}>SetName</button>
    </>;
  }
}

export default App;
