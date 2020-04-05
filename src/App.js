import React from 'react';
import EC2 from './components/EC2';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
          </ul>
        </nav>
        <Switch>
          <Route path="/settings">
            <div>Here comes the settings</div>
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
