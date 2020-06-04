import * as React from 'react';
import Editor from '../components/Editor'
import { Provider } from 'mobx-react';
import RootStore from '../RootStore';
import Settings from "./Settings";


export default {
  title: 'AWS Widgets',
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

