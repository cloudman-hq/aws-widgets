import * as React from 'react';
import { PropertyListWrapper, PropertyContent } from './style';

interface Props {
  name: string;
  value?: any[];
}

const ResourceListProperty: React.FunctionComponent<Props> = (props) => {
  return (
    <PropertyListWrapper>
      <h5>{props.name}:</h5>
      <PropertyContent>
        {props.value?.map((t: any) => (
          <span key={t} title={t}>
            {t}
          </span>
        ))}
      </PropertyContent>
    </PropertyListWrapper>
  );
};

export default ResourceListProperty;
