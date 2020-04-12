import * as React from 'react';
import { Route, Redirect } from 'react-router-dom';
import EC2 from '../EC2';
import Settings from '../Settings';
import Editor from '../Editor';
import Viewer from '../Viewer';

export default () => <>
  <Route path="/" exact render={() => <Redirect to="/viewer" />} />
  <Route path="/index.html" exact render={() => <Redirect to="/viewer" />} />
  <Route path="/settings" component={Settings} />
  <Route path="/editor" component={Editor} />
  <Route path="/viewer" component={Viewer} />
  <Route path="/ec2" component={EC2} />
</>;
