import * as React from 'react';
import { CardWrapper, CardTitle, CardIcon, CardContent } from './style';

interface Props {
  title: string;
  icon?: string;
}

const Ec2Card: React.FunctionComponent<Props> = (props) => {
  return <CardWrapper>
    <CardTitle>
      <h4>{props.title}</h4>
      <CardIcon src={props.icon} />
    </CardTitle>
    <CardContent>
      {props.children}
    </CardContent>
  </CardWrapper>;
};

export default Ec2Card;
