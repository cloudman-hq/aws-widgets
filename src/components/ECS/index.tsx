import * as React from 'react';
import ECSCard from './ECSCard';
import ECSProperty from './ECSProperty';
import ECSLogo from './amazon_ecs-icon.svg';
import { inject, observer } from 'mobx-react';
import { autorun } from 'mobx';
import * as AWS from 'aws-sdk';

interface State {
  isLoading: boolean;
  clusterName: string;
  services: string;
  tasks: string;
}

@inject(({ rootStore }) => ({
  appStore: rootStore.getAppStore(),
  settingStore: rootStore.getSettingStore(),
}))
@observer
class ECS extends React.Component<any, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: true,
      clusterName: '',
      services: '',
      tasks: '',
    };
    this.describe = this.describe.bind(this);
  }

  componentDidMount(): void {
    autorun(this.describe);
  }

  describe() {
    if (
      !this.props.settingsStore.isAccessSetup ||
      !this.props.appStore.isRegionAndResourceSetup
    ) {
      return;
    }

    AWS.config.region = this.props.appStore.region;

    AWS.config.credentials = this.props.settingsStore.awsCredentials;

    const ecs = new AWS.ECS();

    const params = {};
    ecs.listClusters(params, function (err, data) {
      if (!err) {
        this.setState({
          clusterName: data.clusterArns,
        });
      }
      /*
  data = {
   clusterArns: [
      "arn:aws:ecs:us-east-1:<aws_account_id>:cluster/test",
      "arn:aws:ecs:us-east-1:<aws_account_id>:cluster/default"
   ]
  }
  */
    });

    ecs.listServices(params, function (err, data) {
      if (!err) {
        this.setState({
          services: data.serviceArns,
        });
      }
      // an error occurred
      /*
      data = {
       serviceArns: [
          "arn:aws:ecs:us-east-1:012345678910:service/my-http-service"
       ]
      }
      */
    });

    const params1 = {
      cluster: 'test',
    };
    ecs.listTasks(params1, function (err, data) {
      if (!err) {
        this.setState({
          tasks: data.taskArns,
        });
      }
      /*
       data = {
        taskArns: [
           "arn:aws:ecs:us-east-1:012345678910:task/0cc43cdb-3bee-4407-9c26-c0e6ea5bee84",
           "arn:aws:ecs:us-east-1:012345678910:task/6b809ef6-c67e-4467-921f-ee261c15a0a1"
        ]
       }
       */
    });
  }
  render() {
    return (
      <ECSCard title="ECS" icon={ECSLogo}>
        <ECSProperty name={'clusterName'} value={this.state.clusterName} />
        <ECSProperty name={'Serices'} value={this.state.services} />
        <ECSProperty name={'Tasks'} value={this.state.tasks} />
      </ECSCard>
    );
  }
}

export default ECS;
