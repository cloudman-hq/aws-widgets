import * as React from 'react';
import { PropertyWrapper } from './style';

interface Props {
  name: string;
  map?: Map<string, string>;
}

const ResourceMapProperty: React.FunctionComponent<Props> = (props) => {
  return <PropertyWrapper>
    <h5>{props.name}:</h5>
    {props.map.forEach((value, key) => <span>{key}={value}</span>)}
  </PropertyWrapper>;
};

export default ResourceMapProperty;
