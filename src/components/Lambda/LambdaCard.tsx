import * as React from 'react';
import { CardWrapper, CardTitle, CardIcon, CardContent } from './style';
import Spinner from "@atlaskit/spinner";

interface Props {
  title: string;
  icon?: string;
  isLoading: boolean;
}

const LambdaCard: React.FunctionComponent<Props> = (props) => {
  return <CardWrapper>
    <CardTitle>
      <h4>{props.title}</h4>
      {props.isLoading ? <Spinner size="medium"/> : ''}
      <CardIcon src={props.icon} />
    </CardTitle>
    <CardContent>
      {props.children}
    </CardContent>
  </CardWrapper>;
};

export default LambdaCard;
