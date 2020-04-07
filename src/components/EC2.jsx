import React from 'react';
import AWS from 'aws-sdk'

class EC2 extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      accessKey: '',
      secretKey: ''
    };

    const that = this;
    // eslint-disable-next-line no-undef
    if (AP) {
      // eslint-disable-next-line no-undef
      AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials?jsonValue=true', {
        success: function(response){
          console.log(response);
          // TODO: test if response is not a JSON string.
          const jsonResponse = JSON.parse(response);
          const accessKey = jsonResponse.value.accessKey;
          const secretKey = jsonResponse.value.secretKey;

          that.setState({
            accessKey: accessKey,
            secretKey: secretKey
          });
        },
        error: function(error){
          console.log(error);
        }
      });
      console.log('Credentials loaded.')
    } else {
      console.log('Credentials is not loaded as AP is not defined.')
    }

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
        <button onClick={this.describeEc2}>
          Describe
        </button>
      </div>
    )
  }
}

export default EC2;
