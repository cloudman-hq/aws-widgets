import * as React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import S3Viewer from '../index';

it('S3Component should contains title: S3', () => {
  render(<S3Viewer/>);
  expect(screen.queryByText('S3')).toBeInTheDocument();
});

it('S3Component should contains attribute names', () => {
  const { getByText } = render(<S3Viewer/>);
  expect(getByText('Name:')).toBeInTheDocument();
  expect(getByText('IsPublic:')).toBeInTheDocument();
});
