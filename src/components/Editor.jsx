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
        const instanceState = data.Reservations[0].Instances[0].State;
        that.setState({resourceState: instanceState.Name})
      }
    });
  }

  render() {
    return (
      <div>
        <label>
          ARN or resource id such as an EC2 instance ID:
          <input
            type="string"
            onChange={this.handleInputChange}/>
        </label>

        <button onClick={this.describeEc2}>
          Describe
        </button>
        <label> Status: {this.state.resourceState}</label>
      </div>
    )
  }
}

export default EC2;
