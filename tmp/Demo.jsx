import React from 'react';
import AWS from 'aws-sdk'

class Demo extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      accessKey: '',
      secretKey: ''
    };

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

    AWS.config.credentials = new AWS.Credentials(this.state.accessKey, this.state.secretKey);
    var ec2 = new AWS.EC2();
    ec2.describeInstances({}, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        alert('Failed');
      }
      else {
        console.log(data);
        const instances = data.Reservations.flatMap(r => r.Instances.map(i => `${i.InstanceId}: ${i.State.Name}`));
        console.log(instances);
        alert('Succeeded! Check your console for the list of EC2 instances.');
      }
    });
  }

  render() {
    return (
      <div>
        <label>
          Access Key:
          <input
            name="accessKey"
            type="string"
            value={this.state.accessKey}
            onChange={this.handleInputChange}/>
        </label>
        <label>
          Secret Key:
          <input
            name="secretKey"
            type="string"
            value={this.state.secretKey}
            onChange={this.handleInputChange}/>
        </label>
        <button onClick={this.describeEc2}>
          Describe
        </button>
      </div>
    )
  }
}

export default Demo;
