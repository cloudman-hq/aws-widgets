import * as React from 'react';
import Settings from '.';
import { storiesOf } from '@storybook/react'
import { Provider } from 'mobx-react';
import RootStore from '../../store';

const withProvider = (story: any) => (
  <Provider rootStore={new RootStore()}>
    {story()}
  </Provider>
)

storiesOf('Settings', module)
  .addDecorator(withProvider)
  .add('default', () => (
    <Settings />
  ));