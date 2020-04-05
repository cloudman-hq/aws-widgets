import React from 'react';

class EC2 extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      accessKey: '',
      secretKey: ''
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.saveSettings = this.saveSettings.bind(this);
    this.loadSettings = this.loadSettings.bind(this);
  }
  handleInputChange(event) {
    const value = event.target.value;
    const name = event.target.name;

    this.setState({
      [name]: value
    });
  }

  loadSettings(e) {
    e.preventDefault();
    // eslint-disable-next-line no-undef
    if (AP) {
      // eslint-disable-next-line no-undef
      AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials?jsonValue=true', {
        success: function(response){
          console.log(response);
        },
        error: function(error){
          console.log(error);
        }
      });
      console.log('Credentials loaded.')
    } else {
      console.log('Credentials is not loaded as AP is not defined.')
    }

  }

  saveSettings(e) {
    e.preventDefault();
    console.log('Saving credentials.');
    // eslint-disable-next-line no-undef
    if (AP) {
      // eslint-disable-next-line no-undef
      AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials', {
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ accessKey: this.state.accessKey, secretKey: this.state.secretKey}),
        success: function(response){
          console.log(response);
        },
        error: function(error){
          console.log(error);
        }
      });
      console.log('Credentials saved.')
    } else {
      console.log('Credentials is not saved as AP is not defined.')
    }

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
        <button onClick={this.saveSettings}>
          Save
        </button>
        <button onClick={this.loadSettings}>
          Load
        </button>
      </div>
    )
  }
}

export default EC2;
