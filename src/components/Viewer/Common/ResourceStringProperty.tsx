import * as React from 'react';
import { PropertyWrapper } from './style';

interface Props {
  name: string;
  value?: string;
}

const ResourceStringProperty: React.FunctionComponent<Props> = (props) => {
  return <PropertyWrapper>
    <h5>{props.name}:</h5>
    <span title={props.value}>{props.value}</span>
  </PropertyWrapper>;
};

export default ResourceStringProperty;
