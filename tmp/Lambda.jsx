import React from 'react';

class Lambda extends React.Component {

  render() {
    return (
      <div>
        <dl>
          <dt>Runtime</dt> <dd>{this.props.runtime}</dd>
        </dl>
      </div>
    )
  }
}

export default Lambda;
