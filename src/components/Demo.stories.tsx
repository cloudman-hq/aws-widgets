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

const populateFromLocalStorage = (obj: any, key: string) => {
  const item = localStorage.getItem(key);
  if (item) {
    obj[key] = item;
  }
}

const rootStore = new RootStore();
populateFromLocalStorage(rootStore.getSettingsStore(), 'accessKey');
populateFromLocalStorage(rootStore.getSettingsStore(), 'secretKey');

const containerStyle = {
  display: 'flex'
};
export const Demo = () => (
  <Provider rootStore={rootStore}>
    <div style={containerStyle}>
      <Settings />
      <Editor />
    </div>
  </Provider>
);

