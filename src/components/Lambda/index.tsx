import * as React from 'react';
import { LambdaCard } from './style';

class Lambda extends React.Component<any> {
  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <LambdaCard className="lambda">
        <dl>
          <dt>Name</dt><dd>{this.props.name}</dd>
          <dt>Runtime</dt><dd>{this.props.runtime}</dd>
          <dt>Role</dt><dd>{this.props.role}</dd>
        </dl>
      </LambdaCard>
    );
  }
}

export default Lambda;
