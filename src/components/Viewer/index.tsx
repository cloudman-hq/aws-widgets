import * as React from 'react';
import * as AWS from 'aws-sdk';
import Lambda from '../../components/Lambda';
import EC2 from '../../components/EC2';
import { inject, observer } from 'mobx-react';
import { autorun } from 'mobx';
import { ErrorMessage, HelperMessage } from '@atlaskit/form';
import DefaultCard from './DefaultCard';
import Spinner from '@atlaskit/spinner';

/**
 * Include the following scenarios:
 * 1. Access not setup - ACCESS_NOT_SETUP
 * 2. Access keys not valid - ACCESS_NOT_VALID
 * 3. Resource ID not provided - RESOURCE_ID_NOT_PROVIDED
 * 4. Resource does not exist - RESOURCE_DOES_NOT_EXIST
 * then all resources
 */
enum ResourceType {
  UNKNOWN,
  INITIALISING,
  LAMBDA_FUNCTION,
  EC2,
}

interface State {
  resourceType: ResourceType;
  resourceDescription: any;
  isLoading: boolean;
}

interface ResourceDescription {
  lambdaName?: string;
  lambdaRuntime?: string;
  lambdaRole?: string;
  lastUpdateStatus?: string;
  availabilityZone?: string;
  resourceState?: string;
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
    AWS.config.region = this.props.appStore.region;

    AWS.config.credentials = this.props.settingsStore.awsCredentials;
    let resourceDescription: ResourceDescription = {
      lambdaName: '',
      lambdaRuntime: '',
      lambdaRole: '',
      lastUpdateStatus: '',
      availabilityZone: '',
      resourceState: '',
    };
    const resourceId = this.props.appStore.resourceId;

    if (this.props.appStore.isLambda) {
      this.setState({
        isLoading: true,
      });
      // describe lambda
      this.setState({
        resourceType: ResourceType.LAMBDA_FUNCTION,
      });
      // this.props.appStore.setResourceType(resourceType);
    } else {
      // this.props.appStore.setResourceType('EC2');
      this.setState({
        isLoading: true,
        resourceType: ResourceType.EC2,
      });
      const ec2 = new AWS.EC2();
      const params = {
        InstanceIds: [resourceId],
      };
      ec2.describeInstances(params, (err: any, data: any) => {
        if (err) {
          // tslint:disable-next-line: no-console
          console.error(err);
        } else {
          const instance = data.Reservations[0].Instances[0];
          const instanceState = instance.State.Name;
          const availabilityZone = instance.Placement.AvailabilityZone;
          resourceDescription = {
            availabilityZone,
            lambdaRuntime: '',
            resourceState: instanceState,
          };
          this.props.appStore.setResourceDescription(resourceDescription);
        }
        this.setState({
          isLoading: false,
        });
      });
    }
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
    const { isLoading } = this.state;
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
      case ResourceType.LAMBDA_FUNCTION:
        resourceCard = (
          <Lambda arn={this.props.appStore.resourceId} />
        );
        break;
      case ResourceType.EC2:
        resourceCard = (
          <EC2
            resourceId={this.props.appStore.resourceId}
            availabilityZone={this.props.appStore.resourceDescription.availabilityZone}
            resourceState={this.props.appStore.resourceDescription.resourceState}
          />
        );
        break;
    }
    return (
      <div>
        <div className="border rounded leading-normal mt-5 px-4 py-2 max-w-sm w-full lg:max-w-full lg:flex">
          {isLoading ? <Spinner size="medium"/> : ''}
          {resourceCard}
        </div>
      </div>
    );
  }
}

export default Viewer;
