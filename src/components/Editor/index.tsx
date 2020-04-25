import * as React from 'react';
import { inject, observer } from 'mobx-react';
import Viewer from '../Viewer';
import Form, { ErrorMessage, Field, FormFooter, HelperMessage } from '@atlaskit/form';
import TextField from '@atlaskit/textfield/dist/cjs/components/Textfield';
import Button from '@atlaskit/button/dist/cjs/components/Button';

@inject(({ rootStore }) => ({
  appStore: rootStore.getAppStore(),
  settingsStore: rootStore.getSettingsStore(),
}))
@observer
class Editor extends React.Component<any> {
  constructor(props: any) {
    super(props);
    this.setResourceId = this.setResourceId.bind(this);
  }

  setResourceId(data: any) {
    this.props.appStore.setResourceId(data.resourceId);
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
        <Form <{resourceId: string}> onSubmit={this.setResourceId}>
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
      </div>
    );
  }
}

export default Editor;
