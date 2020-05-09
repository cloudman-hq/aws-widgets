import * as React from 'react';
import lambdaLogo from './AWS-Lambda_Lambda-Function_light-bg_4x.svg';
import { autorun } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as AWS from 'aws-sdk';
import { ListTagsRequest } from 'aws-sdk/clients/lambda';
import ResourceCard from '../../Common/ResourceCard';
import ResourceProperty from '../../Common/ResourceProperty';

interface State {
  isLoading: boolean;
  name: string;
  role: string;
  runtime: string;
  lastUpdateStatus: string;
  az: string;
  tags: string;
}

@inject(({ rootStore }) => ({
  appStore: rootStore.getAppStore(),
  settingsStore: rootStore.getSettingsStore(),
}))
@observer
class Lambda extends React.Component<any, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: true,
      name: '',
      role: '',
      runtime: '',
      lastUpdateStatus: '',
      az: '',
      tags: '',
    };
    this.describe = this.describe.bind(this);
  }

  componentDidMount(): void {
    autorun(this.describe);
  }

  describe() {
    if (!this.props.settingsStore.isAccessSetup
      || !this.props.appStore.isRegionAndResourceSetup) {
      return;
    }

    const tags = { tags: '' };
    const resourceId = this.props.arn;

    const lambda = new AWS.Lambda();
    const params = {
      FunctionName: resourceId,
    };
    const req: ListTagsRequest = {
      Resource: resourceId,
    };

    lambda.listTags(req, (err: any, data: any) => {
      if (!err) {
        this.setState({
          tags: JSON.stringify(data.Tags),
        });
      }
      this.props.appStore.setTags(tags);
    });

    lambda.getFunction(params, (err: any, data: any) => {
      if (!err) {
        this.setState({
          name: data.Configuration.FunctionName,
          runtime: data.Configuration.Runtime,
          role: data.Configuration.Role,
          lastUpdateStatus: data.Configuration.LastUpdateStatus,
          az: '',
        });
      }
      this.setState({
        isLoading: false,
      });
    });

  }

  render() {
    return (
      <ResourceCard title="Lambda" icon={lambdaLogo} isLoading={this.state.isLoading}>
        <ResourceProperty name={'Name'} value={this.state.name} />
        <ResourceProperty name={'Role'} value={this.state.role} />
        <ResourceProperty name={'Tags'} value={this.state.tags} />
        <ResourceProperty name={'Runtime'} value={this.state.runtime} />
      </ResourceCard>
    );
  }
}

export default Lambda;
