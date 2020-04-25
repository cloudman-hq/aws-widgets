import * as React from 'react';
import { inject, observer } from 'mobx-react';
import TextField from '@atlaskit/textfield';
import Button from '@atlaskit/button';
import InfoIcon from '@atlaskit/icon/glyph/info';

import { Checkbox } from '@atlaskit/checkbox';
import Form, {
  CheckboxField,
  Field,
  FormFooter,
  HelperMessage,
  ErrorMessage,
  ValidMessage,
} from '@atlaskit/form';

interface State {
  status: string;
}

@inject(({ rootStore }) => ({
  appStore: rootStore.getAppStore(),
  settingsStore: rootStore.getSettingsStore(),
}))
class Settings extends React.Component<any, State> {
  private saveSettings: any;
  private verifyCredentials: any;

  constructor(props: any) {
    super(props);
    this.saveSettings = props.settingsStore.saveSettings;
    this.verifyCredentials = props.settingsStore.verifyCredentials;
    this.state = {
      status: 'NOT_SET',
    };
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(data: any) {
    this.props.settingsStore.setAccessKey(data.accessKey);
    this.props.settingsStore.setSecretKey(data.secretKey);
    this.verifyCredentials()
      .then(() => {
        this.setState({
          status: 'VERIFIED',
        });
        return this.saveSettings();
      }).then(() => {
        this.setState({
          status: 'SAVED',
        });
      }).catch((err: any) => {
        if (err.code === 'INCORRECT') {
          this.setState({
            status: 'REJECTED',
          });
        } else {
          this.setState({
            status: 'FAILED',
          });
        }
      });
  }

  public render() {
    const status = this.state.status;
    let statusMessage: any;
    if (status === 'NOT_SET') {
      // do nothing
    } else if (status === 'REJECTED') {
      statusMessage = <ErrorMessage>The Access Key or Secret Key is not correct</ErrorMessage>;
    } else if (status === 'FAILED') {
      statusMessage = <ErrorMessage>The credentials cannot be saved. Try again.</ErrorMessage>;
    }

    return (
      <div
        style={{
          display: 'flex',
          width: '400px',
          maxWidth: '100%',
          margin: '0 auto',
          flexDirection: 'column',
        }}
      >
        <Form<{ accessKey: string; secretKey: string; remember: boolean }>
          onSubmit={this.onSubmit}
        >
          {({ formProps, submitting }: any) => (
            <form {...formProps}>
              <Field name="accessKey" label="Access Key" isRequired defaultValue="">
                {({ fieldProps, error }: any) => (
                  <React.Fragment>
                    <TextField {...fieldProps} />
                    {!error && (
                      <HelperMessage>
                        The credentials are used to query the status of the AWS resources.
                        We recommend that you give READONLY permission to it.
                      </HelperMessage>
                    )}
                    {error && (
                      <ErrorMessage>
                        This user name is already in use, try another one.
                      </ErrorMessage>
                    )}
                  </React.Fragment>
                )}
              </Field>
              <Field
                name="secretKey"
                label="Secret Key"
                defaultValue=""
                isRequired
                validate={(value: any) =>
                  value && value.length < 8 ? 'TOO_SHORT' : undefined
                }
              >
                {({ fieldProps, error, valid, meta }: any) => (
                  <React.Fragment>
                    <TextField {...fieldProps} />
                    {!error && !valid && (
                      <HelperMessage>
                        Use 8 or more characters with a mix of letters, numbers &
                        symbols.
                      </HelperMessage>
                    )}
                    {error && (
                      <ErrorMessage>
                        Password needs to be more than 8 characters.
                      </ErrorMessage>
                    )}
                    {valid && meta.dirty ? (
                      <ValidMessage>Awesome password!</ValidMessage>
                    ) : null}
                  </React.Fragment>
                )}
              </Field>
              <CheckboxField name="encrypt" label="Encrypt the secret key" defaultIsChecked>
                {({ fieldProps }: any) => (
                  <Checkbox {...fieldProps} label="Encrypt before saving"/>
                )}
              </CheckboxField>
              <HelperMessage>
                Please record your secret key somewhere safely. We (the vendor of this plugin)
                do NOT have access that key.
              </HelperMessage>
              <FormFooter>
                <Button type="submit" appearance="primary" isLoading={submitting}>
                  Save
                </Button>
              </FormFooter>
              <FormFooter>
                {statusMessage}
              </FormFooter>
              <FormFooter>
                <div style={{ margin: '5px', flexShrink: 0 }}>
                  <InfoIcon label="Why shall we set credentials here?"/>
                </div>
                <HelperMessage>
                  The credentials are provided here so that other users won't need to provide or
                  even need to know those credentials.

                  Your "Access Key" and "Secret Key" will be saved in your Confluence Instance.
                  They are NOT sent to us (the vendor of this plugin) in any way. You can always
                  replace the credentials as you wish at any time.
                </HelperMessage>
              </FormFooter>
            </form>
          )}
        </Form>
      </div>
    );
  }
}

export default inject(({ rootStore }) => ({
  settingsStore: rootStore.getSettingsStore(),
}))(observer(Settings));
