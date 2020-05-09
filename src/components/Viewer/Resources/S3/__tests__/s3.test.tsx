import * as React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import S3Component from '../index';

it('The EC2 component should contains title: EC2', () => {
  render(<S3Component/>);
  expect(screen.queryByText('EC2')).toBeInTheDocument();
});

it('The EC2 component should contains attribute names', () => {
  const { getByText } = render(<S3Component/>);
  expect(getByText('Name:')).toBeInTheDocument();
  expect(getByText('State:')).toBeInTheDocument();
  expect(getByText('AZ:')).toBeInTheDocument();
  expect(getByText('Key:')).toBeInTheDocument();
});
