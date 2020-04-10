import React from 'react';

class EC2 extends React.Component {

  render() {
    return (
      <div>
        <dl>
          <dt>AZ:</dt> <dd>{this.props.availabilityZone}</dd>
        </dl>
        <label> Status: {this.props.resourceState}</label>
      </div>
    )
  }
}

export default EC2;
