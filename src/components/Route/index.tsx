import * as React from 'react';
import { Route, Redirect } from 'react-router-dom';
import EC2Component from '../EC2';

export default () => <>
  <Route path="/" exact render={() => <Redirect to="/ec2" />} />
  <Route path="/ec2" component={EC2Component} />
</>;
