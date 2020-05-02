import * as React from 'react';
import Ec2Card from './Ec2Card';
import Ec2Property from './Ec2Property';
import * as AWS from "aws-sdk";
import {autorun} from "mobx";

interface State {
  isLoading: boolean;
  resourceId: string;
  resourceState: string;
  az: string;
}
class EC2Component extends React.Component<any, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: false,
      resourceId: '',
      resourceState: '',
      az: ''
    };
    this.describe = this.describe.bind(this);
  }

  componentDidMount(): void {
    autorun(this.describe);
  }

  describe() {
    // this.props.appStore.setResourceType('EC2');
    this.setState({
      isLoading: true,
    });
    const ec2 = new AWS.EC2();
    const params = {
      InstanceIds: [this.props.instanceId],
    };
    ec2.describeInstances(params, (err: any, data: any) => {
      if (err) {
        // tslint:disable-next-line: no-console
        console.error(err);
      } else {
        const instance = data.Reservations[0].Instances[0];
        const instanceState = instance.State.Name;
        const availabilityZone = instance.Placement.AvailabilityZone;
        this.setState({
          az: availabilityZone,
          resourceState: instanceState
        });
      }
      this.setState({
        isLoading: false,
      });
    });

  }

  render() {
    return (
      <Ec2Card title="EC2" isLoading={this.state.isLoading}>
        <Ec2Property name="Name" value={this.props.instanceId} />
        <Ec2Property name="State" value={this.state.resourceState} />
        <Ec2Property name="AZ" value={this.state.az} />
        <Ec2Property name="Key" value={''} />
      </Ec2Card>
    );
  }
}

export default EC2Component;
