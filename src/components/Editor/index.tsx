import * as React from 'react';
import * as AWS from 'aws-sdk';
import Lambda from '../../components/Lambda';
import EC2 from '../../components/EC2';

interface State {
  resourceId: string;
  resourceType: string;
  resourceDescription: any;
}

class Editor extends React.Component<any, State> {

  constructor(props: any) {
    super(props);

    this.state = {
      resourceType: 'unknown',
      resourceId: null,
      resourceDescription: {},
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.describe = this.describe.bind(this);
  }

  handleInputChange(event: React.FormEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;

    this.setState({
      resourceId: value,
    });
  }

  describe(e: any) {
    e.preventDefault();
    AWS.config.region = 'ap-southeast-2';

    AWS.config.credentials = new AWS.Credentials(this.props.accessKey, this.props.secretKey);
    if (this.state.resourceId.indexOf('arn:aws:lambda') === 0) {
      // describe lambda
      this.setState({ resourceType: 'lambda' });
      const lambda = new AWS.Lambda();
      const params = {
        FunctionName: this.state.resourceId,
      };
      lambda.getFunction(params, (err: any, data: any) => {
        if (!err) {
          this.setState({
            resourceDescription: {
              lambdaRuntime: data.Configuration.Runtime,
            },
          });
        }
      });
    } else {
      const ec2 = new AWS.EC2();
      const params = {
        InstanceIds: [this.state.resourceId],
      };
      ec2.describeInstances(params, (err: any, data: any) => {
        if (err) {
          alert('Failed');
        } else {
          const instance = data.Reservations[0].Instances[0];
          const instanceState = instance.State.Name;
          const availabilityZone = instance.Placement.AvailabilityZone;
          this.setState({
            resourceDescription: { availabilityZone, resourceState: instanceState },
          });
        }
      });
    }
  }

  render() {

    let resourceCard;
    if (this.state.resourceType === 'lambda') {
      resourceCard = <Lambda runtime={this.state.resourceDescription.lambdaRuntime}/>;
    } else {
      resourceCard = <EC2 availabilityZone={this.state.resourceDescription.availabilityZone}
                          resourceState={this.state.resourceDescription.resourceState}/>;
    }
    return (
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          ARN or Resource ID:
          <input
            className="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal"
            name="resourceId"
            type="string"
            placeholder="e.g. i-04308dbefa6eb6ac"
            onChange={this.handleInputChange}/>
        </label>

        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={this.describe}>
          Describe
        </button>
        <div className="border rounded leading-normal mt-5 px-4 py-2 max-w-sm w-full lg:max-w-full lg:flex">
          {resourceCard}
        </div>
      </div>
    );
  }
}

export default Editor;
