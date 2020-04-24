import * as React from 'react';

class EC2Component extends React.Component<any> {
  render() {
    return (
      <div>
        <div>EC2 Instance {this.props.resourceId}:</div>
        <div>
          <label>Instance State:</label>
          <span>{this.props.resourceState}</span>
        </div>
        <div>
          <label>Availability Zone:</label>
          <span>{this.props.availabilityZone}</span>
        </div>
      </div>
    );
  }
}

export default EC2Component;
