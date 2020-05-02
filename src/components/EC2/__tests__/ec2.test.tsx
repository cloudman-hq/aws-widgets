import * as React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import EC2 from '../index';

it('The EC2 component should contains title: EC2', () => {
  render(<EC2/>);
  expect(screen.queryByText('EC2')).toBeInTheDocument();
});

it('The EC2 component should contains attribute names', () => {
  const { getByText } = render(<EC2/>);
  expect(getByText('Name:')).toBeInTheDocument();
  expect(getByText('State:')).toBeInTheDocument();
  expect(getByText('AZ:')).toBeInTheDocument();
  expect(getByText('Key:')).toBeInTheDocument();
});
