import React from 'react';
import { State, Store } from '@sambego/storybook-state';
import EC2 from '../components/EC2'
import Editor from '../components/Editor'

export default {
  title: 'Demo',
  component: EC2,
};

const store = new Store({
  accessKey: '',
  secretKey: ''
});

function handleInputChange(event) {
  const value = event.target.value;
  const name = event.target.name;

  store.set({
    [name]: value
  });
}

export const EC2Component = () => (
  <div>
    <label>
      Access Key:
      <input
        name="accessKey"
        type="string"

        onChange={handleInputChange}/>
    </label>
    <label>
      Secret Key:
      <input
        name="secretKey"
        type="string"

        onChange={handleInputChange}/>
    </label>

    <State store={store}>
      <EC2/>
    </State>
  </div>
);

export const EditorComponent = () => (
  <div>
    <label>
      Access Key:
      <input
        name="accessKey"
        type="string"

        onChange={handleInputChange}/>
    </label>
    <label>
      Secret Key:
      <input
        name="secretKey"
        type="string"

        onChange={handleInputChange}/>
    </label>

    <State store={store}>
      <Editor/>
    </State>
  </div>
);
