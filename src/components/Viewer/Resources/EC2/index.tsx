import * as React from 'react';
import * as AWS from 'aws-sdk';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import ResourceCard from '../../Common/ResourceCard';
import ResourceStringProperty from '../../Common/ResourceStringProperty';

interface EC2State {
  isLoading: boolean;
  resourceId: string;
  resourceState: string;
  az: string;
  keyName?: string;
  tags: string[];
  iamInstanceProfile?: string;
  instanceType?: string;
  privateIp?: string;
  publicDns?: string;
  securityGroups: string[];
  storage?: string;
}

@observer
class EC2Component extends React.Component<any, EC2State> {
  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: false,
      resourceId: '',
      resourceState: '',
      az: '',
      tags: [],
      securityGroups: [],
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
        const instance: any = data.Reservations[0].Instances[0];
        const instanceState = instance.State.Name;
        const availabilityZone = instance.Placement.AvailabilityZone;
        const securityGroups = instance.SecurityGroups
          && instance.SecurityGroups.map((g: any) => g.GroupName) || [];
        this.setState({
          securityGroups,
          az: availabilityZone,
          resourceState: instanceState,
          keyName: instance.KeyName,
          tags: instance.Tags && instance.Tags.map((t: any) => `${t.Key}: ${t.Value}`),
          iamInstanceProfile: instance.IamInstanceProfile && instance.IamInstanceProfile.Arn,
          instanceType: instance.InstanceType,
          privateIp: instance.PrivateIpAddress,
          publicDns: instance.PublicDnsName,
          storage: instance.RootDeviceType,
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
        <ResourceStringProperty name="Name" value={this.props.instanceId} />
        <ResourceStringProperty name="State" value={this.state.resourceState} />
        <ResourceStringProperty name="Type" value={this.state.instanceType} />
        <ResourceStringProperty name="Storage" value={this.state.storage} />
        <ResourceStringProperty name="AZ" value={this.state.az} />
        <ResourceStringProperty name="Key" value={this.state.keyName} />
        <ResourceStringProperty name="IAM" value={this.state.iamInstanceProfile} />
        <ResourceStringProperty name="SGs" value={this.state.securityGroups.join(', ')} />
        <ResourceStringProperty name="PrivateIp" value={this.state.privateIp} />
        <ResourceStringProperty name="PublicDns" value={this.state.publicDns} />
        <ResourceStringProperty name="Tags" value={this.state.tags.join(', ')} />
      </ResourceCard>
    );
  }
}

export default EC2Component;
