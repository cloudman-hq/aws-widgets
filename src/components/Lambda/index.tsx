import * as React from 'react';
import {
  LambdaCard,
  LambdaCardItem,
  LambdaCardItemLabel,
  LambdaCardItemIcon,
  LambdaCardItemValue,
} from './style';
import '../../styles/style.css';
import Icon from '@atlaskit/icon/cjs/components/Icon';
import lambdaLogo from './AWS-Lambda_Lambda-Function_light-bg_4x.svg';
class Lambda extends React.Component<any> {
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <LambdaCard>
        <LambdaCardItem>
          <LambdaCardItemLabel>Name</LambdaCardItemLabel>
          <LambdaCardItemIcon src={lambdaLogo} />
          <LambdaCardItemValue>{this.props.name}</LambdaCardItemValue>
        </LambdaCardItem>
        <LambdaCardItem>
          <LambdaCardItemLabel>Name</LambdaCardItemLabel>
          <LambdaCardItemIcon src={lambdaLogo} />
          <LambdaCardItemValue>{this.props.name}</LambdaCardItemValue>
        </LambdaCardItem>
        <LambdaCardItem>
          <LambdaCardItemLabel>Name</LambdaCardItemLabel>
          <LambdaCardItemIcon src={lambdaLogo} />
          <LambdaCardItemValue>{this.props.name}</LambdaCardItemValue>
        </LambdaCardItem>
        {/* <div className="property" >
          <label className="field-name runtime">Runtime</label>
          <span className="field-icon runtime" />
          <span className="field-value">{this.props.runtime}</span>
        </div>
        <div className="property" >
          <label className="field-name role">Role</label>
          <span className="icon role" />
          <span className="field-value">{this.props.role}</span>
        </div>
        <div className="property" >
          <label className="field-name role">Tags</label>
          <span className="icon role" />
          <span className="field-value">{this.props.tags}</span>
        </div> */}
      </LambdaCard>
    );
  }
}

export default Lambda;
