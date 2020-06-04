import * as React from 'react';
import EC2 from '../components/Viewer/Resources/EC2'
import Editor from '../components/Editor'
import { Provider } from 'mobx-react';
import RootStore from '../RootStore';
import Settings from "./Settings";


export default {
  title: 'Demo',
  component: EC2,
};

let rootStore = new RootStore();
const containerStyle = {
  display: 'flex'
};
export const Demo = () => (
  <Provider rootStore={rootStore}>
    <div style={containerStyle}>
      <Settings />
      <Editor  />
    </div>
  </Provider>
);

