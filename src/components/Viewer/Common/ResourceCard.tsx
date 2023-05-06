import * as React from 'react';
import { CardWrapper, CardTitle, CardIcon, CardContent } from './style';
import Spinner from '@atlaskit/spinner';

interface Props {
  title: string;
  icon?: string;
  isLoading: boolean;
}

const ResourceCard: React.FunctionComponent<Props> = (props) => {
  return <CardWrapper>
    <CardTitle>
      <h4>{props.title}</h4>
      {props.isLoading ? <Spinner size="medium"/> : ''}
      <CardIcon src={props.icon} />
    </CardTitle>
    <CardContent>
      {props.children}
      <div style={{ display: 'none' }}>2023-05-06</div>
    </CardContent>
  </CardWrapper>;
};

export default ResourceCard;
