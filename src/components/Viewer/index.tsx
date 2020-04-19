import * as React from 'react';
import * as AWS from 'aws-sdk';
import Lambda from '../../components/Lambda';
import EC2 from '../../components/EC2';
import { inject, observer } from 'mobx-react';
import { action, autorun, computed } from 'mobx';
import { ListTagsRequest } from 'aws-sdk/clients/lambda';
import { ErrorMessage } from '@atlaskit/form';

interface State {
  resourceType: string;
  resourceDescription: any;
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
      resourceType: 'unknown',
      resourceDescription: {},
    };
    this.describe = this.describe.bind(this);
    autorun(this.describe);
  }

  async describe() {
    AWS.config.region = 'ap-southeast-2';
    if (!this.props.settingsStore.accessKey || !this.props.settingsStore.secretKey) {
      // AccessKey and SecretKey are not provided
      this.setState({
        resourceType: 'Help',
      });
      return;
    }

    AWS.config.credentials = new AWS.Credentials(
      this.props.settingsStore.accessKey,
      this.props.settingsStore.secretKey,
    );
    const resourceId = this.props.appStore.resourceId;

    let tags = { tags: '' };
    let resourceDescription: ResourceDescription = {
      lambdaName: '',
      lambdaRuntime: '',
      lambdaRole: '',
      lastUpdateStatus: '',
      availabilityZone: '',
      resourceState: '',
    };

    if (resourceId.indexOf('arn:aws:lambda') === 0) {
      // describe lambda
      this.setState({
        resourceType: 'lambda',
      });
      // this.props.appStore.setResourceType(resourceType);
      const lambda = new AWS.Lambda();
      const params = {
        FunctionName: resourceId,
      };
      const req: ListTagsRequest = {
        Resource: resourceId,
      };

      lambda.listTags(req, (err: any, data: any) => {
        if (!err) {
          tags = {
            tags: data.Tags,
          };
        }
        this.props.appStore.setTags(tags);
      });

      lambda.getFunction(params, (err: any, data: any) => {
        if (!err) {
          // console.log(JSON.stringify(data));
          resourceDescription = {
            lambdaName: data.Configuration.FunctionName,
            lambdaRuntime: data.Configuration.Runtime,
            lambdaRole: data.Configuration.Role,
            lastUpdateStatus: data.Configuration.LastUpdateStatus,
            availabilityZone: '',
            resourceState: '',
          };

          this.props.appStore.setResourceDescription(resourceDescription);
        }
      });
    } else {
      // this.props.appStore.setResourceType('EC2');
      this.setState({
        resourceType: 'EC2',
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
      });
    }
  }

  render() {
    let resourceCard;
    if (this.state.resourceType === 'lambda') {
      resourceCard = (
        <Lambda
          runtime={this.props.appStore.resourceDescription.lambdaRuntime}
          role={this.props.appStore.resourceDescription.lambdaRole}
          name={this.props.appStore.resourceDescription.lambdaName}
        // tags={this.props.appStore.tags}
        />
      );
    } else if (this.state.resourceType === 'EC2') {
      resourceCard = (
        <EC2
          availabilityZone={
            this.props.appStore.resourceDescription.availabilityZone
          }
          resourceState={this.props.appStore.resourceDescription.resourceState}
        />
      );
    } else {
      resourceCard = (
        <ErrorMessage>
          The access has not been setup. Ask your administrator to set up.
        </ErrorMessage>
      );
    }
    return (
      <div>
        <div className="border rounded leading-normal mt-5 px-4 py-2 max-w-sm w-full lg:max-w-full lg:flex">
          {resourceCard}
        </div>
        <div>
          <label>Debug area</label>
          <label>Access Key: {this.props.settingsStore.accessKey}</label>
          <label>Resource ID:{this.props.appStore.resourceId}</label>
        </div>
      </div>
    );
  }
}

export default Viewer;
