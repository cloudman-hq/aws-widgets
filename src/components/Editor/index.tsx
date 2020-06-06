import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { autorun } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import Viewer from '../Viewer';
import Form, { ErrorMessage, Field, FormFooter, HelperMessage } from '@atlaskit/form';
import TextField from '@atlaskit/textfield/dist/cjs/components/Textfield';
import Select, { AsyncSelect } from '@atlaskit/select';
import Button from '@atlaskit/button/dist/cjs/components/Button';
import { saveMacro } from '../Macro';
import { AP, propertyKey } from '../App/shared';
import regions from '../Aws/Regions';
import resourceTypes from '../Aws/ResourceTypes';

const saveMacroToAP = saveMacro(AP);

const registerOnSubmit = (macroData: any, macroBodyProperty: any) => {
  AP.dialog.getButton('submit').bind(() => {
    saveMacroToAP(macroData, macroBodyProperty);

    // tslint:disable-next-line: no-console
    console.log(`saved macro with data: ${JSON.stringify(macroData)}, body property: ${JSON.stringify(macroBodyProperty)}`);

    AP.confluence.closeMacroEditor();
    return true;
  });
};

interface Option {
  label: string;
  value: string;
}

interface FormData {
  region: Option;
  resourceId: any;
}

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

  updateState(change: any) {
    if (change.region || change.resourceType) {
      const region = change.region || this.state.region;
      const resourceType = change.resourceType || this.state.resourceType;
      if (region && resourceType) {
        const resourceTypeObj = resourceTypes.find(t => t.name === resourceType);
        if (resourceTypeObj) {
          resourceTypeObj.list(region, this.props.settingsStore.awsCredentials)
            .then(data => this.updateState({ options: data }));
        }
      }
    }
    this.setState(Object.assign({}, this.state, change));
  }

  setRegion(region: string) {
    this.updateState({ region });
  }

  setResourceType(resourceType: string) {
    this.updateState({ resourceType });
  }

  setRegionAndResourceId(data: FormData) {
    this.props.appStore.setRegion(data.region.value);
    this.state.macroBodyProperty.value.region = data.region.value;

    const resourceId = data.resourceId.value || data.resourceId;
    this.props.appStore.setResourceId(resourceId);
    this.props.appStore.setResourceType(this.state.resourceType);
    this.state.macroBodyProperty.value.resourceId = resourceId;
    this.state.macroBodyProperty.value.resourceType = this.state.resourceType;

    this.updateState({ macroBodyProperty: this.state.macroBodyProperty });
  }

  async init() {
    let macroData: any;
    let macroBodyProperty: any;

    const initializeProperty = (uuid: string) => {
      const key = propertyKey(uuid);
      macroBodyProperty = { key, value: {}, version: { number: 0 } };
      // tslint:disable-next-line: no-console
      console.log(`initialized macro body property: ${JSON.stringify(macroBodyProperty)}`);
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
            console.log(`loaded macro body property: ${JSON.stringify(macroBodyProperty)}`);
          }

          afterInit();
        });
      }
    });
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
        <Form<FormData> onSubmit={this.setRegionAndResourceId}>
          {(form: any) => (
            <form {...form.formProps}>
              <Field name="region" label="Region" isRequired>
                {({ fieldProps, error }: any) => (
                  <React.Fragment>
                    <Select {...fieldProps}
                      options={regions.map(r =>
                        ({ label: `${r.label} (${r.value})`, value: r.value }))}
                      isSearchable={true}
                      placeholder="Choose a Region"
                      onChange={(e) => {
                        fieldProps.onChange(e);
                        this.setRegion(form.getValues().region && form.getValues().region.value);
                      }}
                    />
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
              <Field name="resourceType" label="Resource Type">
                {({ fieldProps }: any) => (
                  <React.Fragment>
                    <Select {...fieldProps}
                      options={resourceTypes.map(t =>
                        ({ label: t.name, value: t.name, list: t.list }))}
                      isSearchable={true}
                      placeholder="Choose a Type"
                      onChange={(e) => {
                        fieldProps.onChange(e);
                        this.setResourceType(
                          form.getValues().resourceType && form.getValues().resourceType.value);
                      }}
                    />
                    <HelperMessage>
                      The resource type.
                    </HelperMessage>
                  </React.Fragment>
                )}
              </Field>
              <Field name="resourceId" label="Resource ID" isRequired defaultValue="">
                {({ fieldProps, error }: any) => (
                  <React.Fragment>
                    {this.state.region && this.state.resourceType && (
                      <Select {...fieldProps} isSearchable={true} options={this.state.options} />
                    )}

                    {(!this.state.region || !this.state.resourceType) && (
                      <TextField {...fieldProps} />
                    )}

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
                <Button type="submit" appearance="primary" isLoading={form.submitting}>
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
