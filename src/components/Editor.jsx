import React from 'react';
import AWS from 'aws-sdk'

class EC2 extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      accessKey: props.accessKey,
      secretKey: props.secretKey
    };

    const that = this;

    this.handleInputChange = this.handleInputChange.bind(this);
    this.describeEc2 = this.describeEc2.bind(this);
  }

  handleInputChange(event) {
    const value = event.target.value;
    const name = event.target.name;

    this.setState({
      [name]: value
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
      InstanceIds: [ this.state.arn ]
    };
    ec2.describeInstances(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        alert('Failed');
      }
      else {
        console.log(data);
        alert('Succeeded! Check your console for the list of EC2 instances.');
      }
    });
  }

  render() {
    return (
      <div>
        <label>
          ARN:
          <input
            name="arn"
            type="string"
            onChange={this.handleInputChange}/>
        </label>

        <button onClick={this.describeEc2}>
          Describe
        </button>
      </div>
    )
  }
}

export default EC2;
