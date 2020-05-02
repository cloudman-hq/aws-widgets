import * as React from 'react';
import Ec2Card from './Ec2Card';
import Ec2Property from './Ec2Property';

class EC2Component extends React.Component<any> {
  render() {
    return (
      <Ec2Card title="EC2">
        <Ec2Property name="Name" value={this.props.resourceId} />
        <Ec2Property name="State" value={this.props.resourceState} />
        <Ec2Property name="AZ" value={this.props.availabilityZone} />
        <Ec2Property name="Key" value={''} />
      </Ec2Card>
    );
  }
}

export default EC2Component;
