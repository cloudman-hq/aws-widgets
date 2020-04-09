import React from 'react';
import Settings from './components/Settings'
import Demo from './components/Settings'
import Editor from './components/Editor'

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
          <Route path="/editor">
            <Editor/>
          </Route>
          <Route path="/demo">
            <Demo/>
          </Route>
          <Route path="/settings">
            <Settings/>
          </Route>
          <Route path="/">
            <Editor/>
          </Route>
        </Switch>
      </div>
    </Router>
);
}

export default App;
