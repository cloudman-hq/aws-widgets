import * as React from 'react';
import { PropertyListWrapper } from './style';

interface Props {
  name: string;
  value?: any[];
}

const ResourceListProperty: React.FunctionComponent<Props> = (props) => {
  return <PropertyListWrapper>
    <h5>{props.name}:</h5>
    {props.value?.map((t: any) => (<span key={t.Key}>{t.Key}: {t.Value}</span>))}
  </PropertyListWrapper>;
};

export default ResourceListProperty;
