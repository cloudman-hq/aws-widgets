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
        <label>
          ARN or Resource ID:
          <input
            type="string"
            placeholder="e.g. i-04308dbefa6eb6ac"
            onChange={this.handleInputChange}/>
        </label>

        <button onClick={this.describeEc2}>
          Describe
        </button>
        <dl>
          <dt>AZ:</dt> <dd>{this.state.availabilityZone}</dd>
        </dl>
        <label> Status: {this.state.resourceState}</label>
      </div>
    )
  }
}

export default EC2;
