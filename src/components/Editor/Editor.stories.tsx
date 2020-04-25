import * as React from 'react'
import Editor from ".";
import { Provider } from 'mobx-react';
import RootStore from '../../RootStore';
import { storiesOf } from '@storybook/react';

const withProvider = (story: any) => (
  <Provider rootStore={new RootStore()}>
    {story()}
  </Provider>
)

storiesOf('Editor', module)
  .addDecorator(withProvider)
  .add('default', () => (
    <Editor accessKey="Test" secretKey="Role" />
  ));