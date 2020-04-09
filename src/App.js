import React from 'react';
import EC2 from './components/EC2';
import Settings from './components/Settings'
import Demo from './components/Settings'

import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom';
import './styles/app.css'

function App() {
  return (
    <Router>
      <div>
        <Switch>
          <Route path="/demo">
            <Demo/>
          </Route>
          <Route path="/settings">
            <Settings/>
          </Route>
          <Route path="/">
            <EC2/>
          </Route>
        </Switch>
      </div>
    </Router>
);
}

export default App;
