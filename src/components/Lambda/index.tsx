import * as React from 'react';
import lambdaLogo from './AWS-Lambda_Lambda-Function_light-bg_4x.svg';
import LambdaCard from './LambdaCard';
import LambdaProperty from './LambdaProperty';

class Lambda extends React.Component<any> {
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <LambdaCard title="Lambda" icon={lambdaLogo}>
        <LambdaProperty name={'Name'} value={this.props.name} />
        <LambdaProperty name={'Role'} value={this.props.role} />
        <LambdaProperty name={'Tags'} value={this.props.tags} />
        <LambdaProperty name={'Runtime'} value={this.props.runtime} />
      </LambdaCard>
    );
  }
}

export default Lambda;
