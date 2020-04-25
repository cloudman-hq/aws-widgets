import * as React from 'react';
import * as AWS from 'aws-sdk';
import { inject, observer } from 'mobx-react';
import { autorun } from 'mobx';
import Viewer from '../Viewer';
import Form, { ErrorMessage, Field, FormFooter, HelperMessage } from '@atlaskit/form';
import TextField from '@atlaskit/textfield/dist/cjs/components/Textfield';
import Button from '@atlaskit/button/dist/cjs/components/Button';

interface State {
  resourceId: string;
  resourceType: string;
  resourceDescription: any;
}

@inject(({ rootStore }) => ({
  appStore: rootStore.getAppStore(),
  settingsStore: rootStore.getSettingsStore(),
}))
@observer
class Editor extends React.Component<any, State> {
  constructor(props: any) {
    super(props);

    this.state = {
      resourceId: '',
      resourceType: 'unknown',
      resourceDescription: {},
    };

    this.init = this.init.bind(this);
    autorun(this.init);

    this.handleInputChange = this.handleInputChange.bind(this);
    this.describe = this.describe.bind(this);
  }

  async init() {
    const resourceId = this.props.appStore.resourceId;
    this.setState({ resourceId });
  }

  handleInputChange(event: React.FormEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;

    this.setState({
      resourceId: value,
    });
  }

  describe(data: any) {
    AWS.config.region = 'ap-southeast-2';

    AWS.config.credentials = new AWS.Credentials(
      this.props.settingsStore.accessKey,
      this.props.settingsStore.secretKey,
    );
    const resourceId = data.resourceId;
    this.props.appStore.setResourceId(resourceId);
  }

  render() {
    return (
      <div style={{
        display: 'flex',
        width: '400px',
        maxWidth: '100%',
        margin: '0 auto',
        flexDirection: 'column',
      }}>
        <Form <{resourceId: string}> onSubmit={this.describe}>
          {({ formProps, submitting }: any) => (
            <form {...formProps}>
              <Field name="resourceId" label="Resource ID" isRequired defaultValue="">
                {({ fieldProps, error }: any) => (
                  <React.Fragment>
                    <TextField {...fieldProps} />
                    {!error && (
                      <HelperMessage>
                        A resource ID can be an EC2 instance ID or a Lambda function ARN.
                      </HelperMessage>
                    )}
                    {error && (
                      <ErrorMessage>
                        The above resource cannot be found.
                      </ErrorMessage>
                    )}
                  </React.Fragment>
                )}
              </Field>

              <FormFooter>
                <Button type="submit" appearance="primary" isLoading={submitting}>
                  Describe
                </Button>
              </FormFooter>
              <FormFooter>
                <Viewer />
              </FormFooter>
            </form>
          )}

        </Form>
        <hr/>
        <div className="border rounded leading-normal mt-5 px-4 py-2 max-w-sm w-full lg:max-w-full lg:flex"/>
      </div>
    );
  }
}

export default Editor;
