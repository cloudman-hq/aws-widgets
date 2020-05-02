import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import Region from '../Region';
import AppStore from '../../App/AppStore';

const appStore = new AppStore();
const setup = () => {
  const utils = render(<Region appStore={appStore} />);
  const input = utils.getByLabelText('region-input');
  return {
    input,
    ...utils,
  };
};

it('It should store the input in the AppStore', () => {
  const { input } = setup();
  fireEvent.change(input, { target: { value: 'ap-southeast-3' } });

  expect(appStore.region).toBe('ap-southeast-3');
});
