import React from 'react';
import AWS from 'aws-sdk'
import EC2 from './EC2'
import Lambda from './Lambda'

class Editor extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      accessKey: props.accessKey,
      secretKey: props.secretKey,
      resourceType: 'unknown',
      id: null,
      resourceState: 'unknown',
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.describe = this.describe.bind(this);
  }

  handleInputChange(event) {
    const value = event.target.value;

    this.setState({
      id: value
    });
  }

  describe(e) {
    e.preventDefault();
    console.log('Describe EC2');
    AWS.config.region = 'ap-southeast-2';

    AWS.config.credentials = new AWS.Credentials(this.state.accessKey || this.props.accessKey,
      this.state.secretKey || this.props.secretKey);
    if (this.state.id.indexOf('arn:aws:lambda') === 0) {
      // describe lambda
      this.setState({ resourceType: 'lambda' });
      var lambda = new AWS.Lambda();
      const params = {
        FunctionName: this.state.id
      };
      const that = this;
      lambda.getFunction(params, function (err, data) {
        if (err) {
          console.error(err);
        } else {
          console.log(data);
          that.setState({
            lambdaRuntime: data.Configuration.Runtime
          });
        }
      });
    } else {
      var ec2 = new AWS.EC2();
      const params = {
        InstanceIds: [ this.state.id ]
      };
      const that = this;
      ec2.describeInstances(params, function(err, data) {
        if (err) {
          console.log(err, err.stack);
          alert('Failed');
        }
        else {
          console.log(data);
          let instance = data.Reservations[0].Instances[0];
          const instanceState = instance.State.Name;
          const availabilityZone = instance.Placement.AvailabilityZone;
          that.setState({resourceState: instanceState, availabilityZone})
        }
      });
    }
  }

  render() {

    let resourceCard;
    if (this.state.resourceType === 'lambda') {
      resourceCard = <Lambda runtime={this.state.lambdaRuntime}/>
    } else {
      resourceCard = <EC2 availabilityZone={this.state.availabilityZone} resourceState={this.state.resourceState}/>
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
    )
  }
}

export default Editor;