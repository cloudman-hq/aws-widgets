import * as React from 'react';
import { Route, Redirect } from 'react-router-dom';
import EC2 from '../EC2';
import Settings from '../Settings';
import Editor from "../Editor";

export default () => <>
  <Route path="/" exact render={() => <Redirect to="/ec2" />} />
  <Route path="/settings" component={Settings} />
  <Route path="/editor" component={Editor} />
  <Route path="/ec2" component={EC2} />
</>;
