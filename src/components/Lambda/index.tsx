import * as React from 'react';

interface State {
  name: string;
  role: string;
}

class Lambda extends React.Component<any, State> {
  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <div>
        <dl>
          <dt>Name</dt><dd>{this.props.name}</dd>
          <dt>Role</dt><dd>{this.props.role}</dd>
        </dl>
      </div>
    );
  }
}

export default Lambda;
