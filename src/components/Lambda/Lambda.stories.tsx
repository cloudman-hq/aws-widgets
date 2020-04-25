import * as React from 'react'
import Lambda from '.'
import { Provider } from 'mobx-react';
import RootStore from '../../RootStore';
import { storiesOf } from '@storybook/react';

const withProvider = (story: any) => (
  <Provider rootStore={new RootStore()}>
    {story()}
  </Provider>
)

storiesOf('Lambda', module)
  .addDecorator(withProvider)
  .add('default', () => (
    <Lambda />
  ));