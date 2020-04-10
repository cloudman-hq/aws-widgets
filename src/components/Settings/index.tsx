import * as React from 'react';

interface State {
  accessKey: string;
  secretKey: string;
}

class SettingsComponent extends React.Component<any, State> {

  constructor(props: any) {
    super(props);

    this.state = {
      accessKey: '',
      secretKey: '',
    };
  }

  public handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    const name = event.currentTarget.name;

    this.setState({
      [name]: value,
    } as Pick<State, keyof State>);
  }

  public loadSettings = (e: any) => {
    e.preventDefault();
    // eslint-disable-next-line no-undef
    if ((window as any).AP) {
      // eslint-disable-next-line no-undef
      (window as any).AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials?jsonValue=true', {
        success: (response: any) => {
          // tslint:disable-next-line: no-console
          console.log(response);
        },
        error: (error: any) => {
          // tslint:disable-next-line: no-console
          console.log(error);
        },
      });
      // tslint:disable-next-line: no-console
      console.log('Credentials loaded.');
    } else {
      // tslint:disable-next-line: no-console
      console.log('Credentials is not loaded as AP is not defined.');
    }
  }

  public saveSettings = (e: any) => {
    e.preventDefault();
    // tslint:disable-next-line: no-console
    console.log('Saving credentials.');
    // eslint-disable-next-line no-undef
    if ((window as any).AP) {
      // eslint-disable-next-line no-undef
      (window as any).AP.request('/rest/atlassian-connect/1/addons/com.aws.widget.confluence-addon/properties/aws-credentials', {
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ accessKey: this.state.accessKey, secretKey: this.state.secretKey }),
        success: (response: any) => {
          // tslint:disable-next-line: no-console
          console.log(response);
        },
        error: (error: any) => {
          // tslint:disable-next-line: no-console
          console.log(error);
        },
      });
      // tslint:disable-next-line: no-console
      console.log('Credentials saved.');
    } else {
      // tslint:disable-next-line: no-console
      console.log('Credentials is not saved as AP is not defined.');
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
            onChange={this.handleInputChange} />
        </label>
        <label>
          Secret Key:
          <input
            name="secretKey"
            type="string"
            value={this.state.secretKey}
            onChange={this.handleInputChange} />
        </label>
        <button onClick={this.saveSettings}>
          Save
        </button>
        <button onClick={this.loadSettings}>
          Load
        </button>
      </div>
    );
  }
}

export default SettingsComponent;
