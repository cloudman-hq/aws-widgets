import React from 'react';
import AWS from 'aws-sdk'

class EC2 extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      accessKey: props.accessKey,
      secretKey: props.secretKey,
      id: null,
      resourceState: 'unknown'
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.describeEc2 = this.describeEc2.bind(this);
  }

  handleInputChange(event) {
    const value = event.target.value;
    const name = event.target.name;

    this.setState({
      id: value
    });
  }

  describeEc2(e) {
    e.preventDefault();
    console.log('Describe EC2');
    AWS.config.region = 'ap-southeast-2';

    AWS.config.credentials = new AWS.Credentials(this.state.accessKey || this.props.accessKey,
      this.state.secretKey || this.props.secretKey);
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

  render() {
    return (
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          ARN or Resource ID:
          <input
            className="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal"
            type="string"
            placeholder="e.g. i-04308dbefa6eb6ac"
            onChange={this.handleInputChange}/>
        </label>

        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={this.describeEc2}>
          Describe
        </button>
        <div className="border rounded leading-normal mt-5 px-4 py-2 max-w-sm w-full lg:max-w-full lg:flex">
          <dl>
            <dt>AZ:</dt> <dd>{this.state.availabilityZone}</dd>
          </dl>
          <label> Status: {this.state.resourceState}</label>
        </div>
      </div>
    )
  }
}

export default EC2;
