import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { autorun } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import Viewer from '../Viewer';
import Form, {
  ErrorMessage,
  Field,
  FormFooter,
  HelperMessage,
} from '@atlaskit/form';
import TextField from '@atlaskit/textfield/dist/cjs/components/Textfield';
import Button from '@atlaskit/button/dist/cjs/components/Button';
import { saveMacro } from '../Macro';
import { AP, propertyKey } from '../App/shared';

const saveMacroToAP = saveMacro(AP);

const registerOnSubmit = (macroData: any, macroBodyProperty: any) => {
  AP.dialog.getButton('submit').bind(() => {
    saveMacroToAP(macroData, macroBodyProperty);

    // tslint:disable-next-line: no-console
    console.log(
      `saved macro with data: ${JSON.stringify(
        macroData,
      )}, body property: ${JSON.stringify(macroBodyProperty)}`,
    );

    AP.confluence.closeMacroEditor();
    return true;
  });
};

@inject(({ rootStore }) => ({
  appStore: rootStore.getAppStore(),
  settingsStore: rootStore.getSettingsStore(),
}))
@observer
class Editor extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.setRegionAndResourceId = this.setRegionAndResourceId.bind(this);
    this.state = {
      macroBodyProperty: {
        value: {
          region: '',
          resourceId: '',
        },
      },
    };
    this.init = this.init.bind(this);
    autorun(this.init);
  }

  setRegionAndResourceId(data: any) {
    this.props.appStore.setRegion(data.region);
    this.state.macroBodyProperty.value.region = data.region;
    this.props.appStore.setResourceId(data.resourceId);
    this.state.macroBodyProperty.value.resourceId = data.resourceId;
  }

  async init() {
    let macroData: any;
    let macroBodyProperty: any;

    const initializeProperty = (uuid: string) => {
      const key = propertyKey(uuid);
      macroBodyProperty = { key, value: {}, version: { number: 0 } };
      // tslint:disable-next-line: no-console
      console.log(
        `initialized macro body property: ${JSON.stringify(macroBodyProperty)}`,
      );
    };

    const afterInit = () => {
      registerOnSubmit(macroData, macroBodyProperty);
      this.setState({ macroBodyProperty });
      this.props.appStore.setRegion(macroBodyProperty.value.region);
      this.props.appStore.setResourceId(macroBodyProperty.value.resourceId);
    };

    AP.confluence.getMacroData((data: any) => {
      macroData = data;
      if (!macroData || !macroData.uuid) {
        macroData = { uuid: uuidv4() };
        // tslint:disable-next-line: no-console
        console.log(`initialized macro data: ${JSON.stringify(macroData)}`);

        initializeProperty(macroData.uuid);

        afterInit();
      } else {
        const key = propertyKey(macroData.uuid);
        AP.confluence.getContentProperty(key, (property: any) => {
          macroBodyProperty = property;
          if (!macroBodyProperty) {
            initializeProperty(macroData.uuid);
          } else {
            // tslint:disable-next-line: no-console
            console.log(
              `loaded macro body property: ${JSON.stringify(macroBodyProperty)}`,
            );
          }

          afterInit();
        });
      }
    });
  }

  render() {
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
        <Form<{ region: string; resourceId: string }>
          onSubmit={this.setRegionAndResourceId}
        >
          {({ formProps, submitting }: any) => (
            <form {...formProps}>
              <Field name="region" label="Region" isRequired defaultValue="">
                {({ fieldProps, error }: any) => (
                  <React.Fragment>
                    <TextField {...fieldProps} />
                    {!error && (
                      <HelperMessage>
                        The region where your resource are tied to.
                      </HelperMessage>
                    )}
                    {error && (
                      <ErrorMessage>
                        The above region cannot be found.
                      </ErrorMessage>
                    )}
                  </React.Fragment>
                )}
              </Field>
              <Field
                name="resourceId"
                label="Resource ID"
                isRequired
                defaultValue=""
              >
                {({ fieldProps, error }: any) => (
                  <React.Fragment>
                    <TextField {...fieldProps} />
                    {!error && (
                      <HelperMessage>
                        A resource ID can be an EC2 instance ID or a Lambda
                        function ARN.
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
                <Button
                  type="submit"
                  appearance="primary"
                  isLoading={submitting}
                >
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
