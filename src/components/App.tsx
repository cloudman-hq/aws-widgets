import * as React from 'react';
import EC2Component from './EC2';
import SettingsComponent from './Settings';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

const App: React.FunctionComponent = () => {
  return <Router>
    <div>
      <Switch>
        <Route path="/settings">
          <SettingsComponent />
        </Route>
        <Route path="/">
          <EC2Component />
        </Route>
      </Switch>
    </div>
  </Router>;
};

export default App;
