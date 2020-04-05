import React from 'react';
import AWS from 'aws-sdk'

class EC2 extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      accessKey: '',
      secretKey: ''
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.saveSettings = this.saveSettings.bind(this);
  }
  handleInputChange(event) {
    const value = event.target.value;
    const name = event.target.name;

    this.setState({
      [name]: value
    });
  }

  saveSettings(e) {
    e.preventDefault();
    console.log('Saving credentials.');
    // TODO: Save settings
    console.log('Credentials saved.')
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
      </div>
    )
  }
}

export default EC2;
