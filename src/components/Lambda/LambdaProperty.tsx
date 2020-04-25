import * as React from 'react';
import { PropertyWrapper } from './style';

interface Props {
  name: string;
  value?: any;
}

const LambdaProperty: React.FunctionComponent<Props> = (props) => {
  const { value } = props;
  return <PropertyWrapper>
    <h5 className="property-name">{props.name}:</h5>
    {
      typeof value === 'string' ?
        <span className="property-value">{props.value}</span> :
        <ul className="property-value">
          {
            value && Object.keys(value).map((key, index) => {
              return <li key={index}>
                <b>{key}: </b><span>{value[key]}</span>
              </li>;
            })
          }
        </ul>
    }
  </PropertyWrapper>;
};

export default LambdaProperty;
