import * as React from 'react';
import { PropertyWrapper } from './style';

interface Props {
  name: string;
  array?: string[];
}

const ResourceArrayProperty: React.FunctionComponent<Props> = (props) => {

  return <PropertyWrapper>
    <h5>{props.name}:</h5>
    <span>{props.array.length > 0 ? 'empty' : props.array.join(',')}</span>
  </PropertyWrapper>;
};

export default ResourceArrayProperty;
