import * as React from 'react';
import * as AWS from 'aws-sdk';
import { autorun } from 'mobx';
import ResourceProperty from '../Viewer/Common/ResourceProperty';
import ResourceCard from '../Viewer/Common/ResourceCard';

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
      az: '',
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
          resourceState: instanceState,
        });
      }
      this.setState({
        isLoading: false,
      });
    });

  }

  render() {
    return (
      <ResourceCard title="EC2" isLoading={this.state.isLoading}>
        <ResourceProperty name="Name" value={this.props.instanceId} />
        <ResourceProperty name="State" value={this.state.resourceState} />
        <ResourceProperty name="AZ" value={this.state.az} />
        <ResourceProperty name="Key" value={''} />
      </ResourceCard>
    );
  }
}

export default EC2Component;
