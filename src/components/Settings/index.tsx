import * as React from 'react';
import { inject, observer } from 'mobx-react';
import TextField from '@atlaskit/textfield';
import Button, { ButtonGroup } from '@atlaskit/button';
import { Checkbox } from '@atlaskit/checkbox';
import Form, {
  CheckboxField,
  Field,
  FormFooter,
  HelperMessage,
  ErrorMessage,
  ValidMessage,
} from '@atlaskit/form';
import { subscribers } from './SettingsStore';

const Settings: React.FunctionComponent = ({ settingsStore }: any) => {
  const {
    saveSettings,
    loadSettings,
    accessKey,
    secretKey,
  } = settingsStore;



  function onSubmit(data: any) {
    subscribers.accessKey$.next(data.accessKey);
    subscribers.secretKey$.next(data.secretkey);
    saveSettings();
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
        onSubmit={onSubmit}
      >
        {({ formProps, submitting }) => (
          <form {...formProps}>
            <Field name="accessKey" label="Access Key" isRequired defaultValue="">
              {({ fieldProps, error }) => (
                <React.Fragment>
                  <TextField autoComplete="off" {...fieldProps} />
                  {!error && (
                    <HelperMessage>
                      You can use letters, numbers & periods.
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
              validate={value =>
                value && value.length < 8 ? 'TOO_SHORT' : undefined
              }
            >
              {({ fieldProps, error, valid, meta }) => (
                <React.Fragment>
                  <TextField type="password" {...fieldProps} />
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
            <CheckboxField name="remember" label="Remember me" defaultIsChecked>
              {({ fieldProps }) => (
                <Checkbox {...fieldProps} label="Encrypt before saving" />
              )}
            </CheckboxField>
            <FormFooter>
              <ButtonGroup>
                <Button appearance="subtle">Cancel</Button>
                <Button type="submit" appearance="primary" isLoading={submitting}>
                  Sign up
                </Button>
              </ButtonGroup>
            </FormFooter>
          </form>
        )}
      </Form>
    </div>
  );
};

export default inject(({ rootStore }) => ({
  settingsStore: rootStore.getSettingsStore(),
}))(observer(Settings));
