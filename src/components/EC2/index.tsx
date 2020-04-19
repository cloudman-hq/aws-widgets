import * as React from 'react';
import * as AWS from 'aws-sdk';

interface State {
  accessKey: string;
  secretKey: string;
}

class EC2Component extends React.Component<any, State> {

  constructor(props: any) {
    super(props);

    this.state = {
      accessKey: '',
      secretKey: '',
    };

    // eslint-disable-next-line no-undef
    if ((window as any).AP) {
      // eslint-disable-next-line no-undef
      (window as any).AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials?jsonValue=true', {
        success: (response: any) => {
          const jsonResponse = JSON.parse(response);
          const accessKey = jsonResponse.value.accessKey;
          const secretKey = jsonResponse.value.second;

          this.setState({
            accessKey,
            secretKey,
          });
        },
        error: (error: any) => {
          // tslint:disable-next-line: no-console
          console.log(error);
        },
      });
      // tslint:disable-next-line: no-console
      console.log('Credentials loaded.');
    } else {
      // tslint:disable-next-line: no-console
      console.log('Credentials is not loaded as AP is not defined.');
    }
  }

  public handleInputChange = (event: React.FormEvent<HTMLFormElement>) => {
    const value = event.currentTarget.value;
    const name = event.currentTarget.name;

    this.setState({
      [name]: value,
    } as Pick<State, keyof State>);
  }

  public describeEc2 = (e: any) => {
    e.preventDefault();
    // tslint:disable-next-line: no-console
    console.log('Describe EC2');
    AWS.config.region = 'ap-southeast-2';

    AWS.config.credentials = new AWS.Credentials(this.state.accessKey, this.state.secretKey);
    const ec2 = new AWS.EC2();
    ec2.describeInstances({}, (err, data: AWS.EC2.Types.DescribeInstancesResult) => {
      if (err) {
        // tslint:disable-next-line: no-console
        console.log(err, err.stack);
        alert('Failed');
      } else {
        // tslint:disable-next-line: no-console
        console.log(data);
        const instances = (data as any).Reservations.flatMap((r: any) => r.Instances.map((i: any) => `${i.InstanceId}: ${i.State.Name}`));
        // tslint:disable-next-line: no-console
        console.log(instances);
        alert('Succeeded! Check your console for the list of EC2 instances.');
      }
    });
  }

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
        <div>
          <button onClick={this.describeEc2}>
            Describe
          </button>
        </div>
      </div>
    );
  }
}

export default EC2Component;
