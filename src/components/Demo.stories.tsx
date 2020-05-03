import * as React from 'react';
import { State, Store } from '@sambego/storybook-state';
import EC2 from '../components/EC2'
import Editor from '../components/Editor'
// import '../styles/app.css'
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'mobx-react';
import RootStore from '../RootStore';

import App from "./App";

export default {
  title: 'Demo',
  component: EC2,
};

let rootStore = new RootStore();

const store = new Store({
  accessKey: '',
  secretKey: ''
});
function handleInputChange(event: any) {
  const value = event.target.value;

  const name = event.target.name;
  store.set({
    [name]: value
  });

  if (name === 'accessKey') {
    rootStore.getSettingsStore().setAccessKey(value)
  }
  if (name === 'secretKey') {
    rootStore.getSettingsStore().setSecretKey(value)
  }
}

export const EC2Component = () => (
  <div>
    <EC2/>
  </div>
);
export const EditorComponent = () => (
  <Provider rootStore={rootStore}>
  <div
    className="bg-white rounded-t-lg overflow-hidden border-t border-l border-r border-gray-400 p-4 px-3 py-10 bg-gray-200 flex justify-center">
    <div className="w-full max-w-xs">
      <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Access Key:
            <input
              className="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal"
              name="accessKey"
              type="string"

              onChange={handleInputChange} />
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Secret Key:
            <input
              className="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal"
              name="secretKey"
              type="string"
              onChange={handleInputChange} />
          </label>
        </div>
      </form>

        <State store={store}>
          <Editor accessKey={store.state.accessKey} secretKey={store.state.secretKey} />
        </State>
    </div>

  </div>
  </Provider>
);

export const AppStory = () => (
  <Provider rootStore={new RootStore()}>
    <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Access Key:
          <input
            className="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal"
            name="accessKey"
            type="string"
            onChange={handleInputChange} />
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Secret Key:
          <input
            className="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal"
            name="secretKey"
            type="string"
            onChange={handleInputChange} />
        </label>
      </div>
    </form>
    <Router>
      <App location="/editor" />
    </Router>
  </Provider>
);
