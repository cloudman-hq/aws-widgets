import * as React from 'react'
import DynamodbComponent from '.'
import { Provider } from 'mobx-react';
import RootStore from '../../../../RootStore';

export default {
  title: 'Dynamodb',
  component: DynamodbComponent
}

export const DynamodbDemo = () => (
  <Provider rootStore={new RootStore()}>
    <DynamodbComponent />
  </Provider>
);
