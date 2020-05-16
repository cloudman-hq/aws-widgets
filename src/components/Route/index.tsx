import * as React from 'react';
import { Route, Redirect } from 'react-router-dom';
import EC2 from '../Viewer/Resources/EC2';
import Settings from '../Settings';
import Editor from '../Editor';
import Viewer from '../Viewer';
import { getUrlParam } from '../App/shared';

const withParam = (name: string) => `${name}=${getUrlParam(name)}`;

export default () => <>
  <Route path="/" exact render={() => <Redirect to={`/viewer?${withParam('xdm_e')}&${withParam('uuid')}`} />} />
  <Route path="/index.html" exact render={() => <Redirect to={`/viewer?${withParam('xdm_e')}&${withParam('uuid')}`} />} />
  <Route path="/settings" component={Settings} />
  <Route path="/editor" component={Editor} />
  <Route path="/viewer" component={Viewer} />
  <Route path="/ec2" component={EC2} />
</>;
