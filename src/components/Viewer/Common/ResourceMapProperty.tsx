import * as React from 'react';
import { PropertyListWrapper, PropertyContent } from './style';

interface Props {
  name: string;
  map?: Map<string, string>;
}

const ResourceMapProperty: React.FunctionComponent<Props> = (props) => {
  return (
    <PropertyListWrapper>
      <h5>{props.name}:</h5>
      <PropertyContent>
        {props.map.forEach((value, key) => (
          <span>
            {key}={value}
          </span>
        ))}
      </PropertyContent>
    </PropertyListWrapper>
  );
};

export default ResourceMapProperty;
