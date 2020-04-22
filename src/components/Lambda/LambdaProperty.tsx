import * as React from 'react';
import { PropertyWrapper } from './style';

interface Props {
  name: string;
  value?: string;
}

const LambdaProperty: React.FunctionComponent<Props> = (props) => {
  return <PropertyWrapper>
    <h5>{props.name}:</h5>
    <span>{props.value}</span>
  </PropertyWrapper>;
};

export default LambdaProperty;
