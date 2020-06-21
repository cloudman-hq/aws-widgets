import * as React from 'react';
import Lambda from './Resources/Lambda';
import EC2 from './Resources/EC2';
import Generic from './Resources/Generic';
import { inject, observer } from 'mobx-react';
import { autorun } from 'mobx';
import { ErrorMessage, HelperMessage } from '@atlaskit/form';
import DefaultCard from './DefaultCard';
import * as AWS from 'aws-sdk';
import { ResourceType } from './Resources';
import S3Viewer from './Resources/S3';

interface State {
  resourceType: ResourceType;
  resourceDescription: any;
  isLoading: boolean;
}
@inject(({ rootStore }) => ({
  appStore: rootStore.getAppStore(),
  settingsStore: rootStore.getSettingsStore(),
}))
@observer
class Viewer extends React.Component<any, State> {
  constructor(props: any) {
    super(props);

    this.state = {
      resourceType: ResourceType.INITIALISING,
      resourceDescription: {},
      isLoading: false,
    };
    this.describe = this.describe.bind(this);
    autorun(this.describe);
  }

  async describe() {
    if (!this.props.settingsStore.isAccessSetup
      || !this.props.appStore.isRegionAndResourceSetup) {
      return;
    }

    AWS.config.credentials = this.props.settingsStore.awsCredentials;
    AWS.config.region = this.props.appStore.region;

    this.setState({
      resourceType: this.props.appStore.getResourceType,
    });
  }

  render() {
    if (!this.props.settingsStore.isAccessSetup) {
      return (
        <DefaultCard title={'Access not setup'}>
          <ErrorMessage>
            The access has not been setup. Ask your administrator to set up.
          </ErrorMessage>
        </DefaultCard>
      );
    }
    if (!this.props.appStore.isRegionAndResourceSetup) {
      return (
        <DefaultCard title={'Region or resource ID not provided'}>
          <HelperMessage>
            Edit this page.
            Click the PEN icon under this macro to provide a resource ID in the macro editor.
          </HelperMessage>
        </DefaultCard>
      );
    }
    let resourceCard;
    switch (this.state.resourceType) {
      case ResourceType.UNKNOWN:
        resourceCard = (
          <DefaultCard title={'Unknown Error'}>
            <ErrorMessage>
              Unknown error happens. Please contact support.
            </ErrorMessage>
          </DefaultCard>);
        break;
      case ResourceType.INITIALISING:
        resourceCard = (
          <DefaultCard title={'Initialising'}>
            <HelperMessage>
              We are retrieving data for you...
            </HelperMessage>
          </DefaultCard>);
        break;
      case ResourceType.EC2:
        resourceCard = (
          <EC2 instanceId={this.props.appStore.resourceId} />
        );
        break;
      case ResourceType.LAMBDA_FUNCTION:
      case ResourceType.Generic:
        resourceCard = (
          <Generic resourceId={this.props.appStore.resourceId}
            resourceType={this.props.appStore.resourceType} />
        );
        break;
      case ResourceType.S3:
        resourceCard = (
          <S3Viewer bucketName={this.props.appStore.getS3BucketName} />
        );
        break;
    }
    return (
      resourceCard
    );
  }
}

export default Viewer;
