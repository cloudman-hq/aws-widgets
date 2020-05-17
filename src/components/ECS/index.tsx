import * as React from 'react';
import ECSCard from './ECSCard';
import ECSProperty from './ECSProperty';
import ECSLogo from './amazon_ecs-icon.svg';
import { autorun } from 'mobx';
import * as AWS from 'aws-sdk';

interface State {
  isLoading: boolean;
  clusterName: string;
  services: string;
  tasks: string;
  az: string;
}

class ECS extends React.Component<any, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: false,
      clusterName: '',
      services: '',
      tasks: '',
      az: '',
    };
    this.describe = this.describe.bind(this);
  }

  componentDidMount(): void {
    autorun(this.describe);
  }

  describe() {
    this.setState({
      isLoading: true,
    });

    const ecs = new AWS.ECS();
    const params = {};

    ecs.listClusters(params, (err, data) => {
      if (!err) {
        this.setState({
          clusterName: data.clusterArns[0],
          isLoading: false,
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

    ecs.listServices(params, (err, data) => {
      if (!err) {
        this.setState({
          services: data.serviceArns[0],
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
    ecs.listTasks(params1, (err, data) => {
      if (!err) {
        this.setState({
          tasks: data.taskArns[0],
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
