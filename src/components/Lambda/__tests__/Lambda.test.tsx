import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';
import Lambda from '../index';
import * as React from 'react';

it('should accept an arn property and load the data all by itself', () => {
  const { getByText } = render(<Lambda arn={'arn'} />);
  expect(getByText('Name:')).toBeInTheDocument();
});
