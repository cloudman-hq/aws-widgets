import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '@testing-library/jest-dom'
import {render, fireEvent, screen} from '@testing-library/react'

import EC2 from '../index'

it('The EC2 component should contains title: EC2', () => {
  render(<EC2></EC2>);
  expect(screen.queryByText("EC2")).toBeInTheDocument();
});
