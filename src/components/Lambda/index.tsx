import * as React from 'react';

class Lambda extends React.Component<any> {
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
