import * as React from 'react';
import { autorun } from 'mobx';
import ResourceCard from '../../Common/ResourceCard';
import ResourceStringProperty from '../../Common/ResourceStringProperty';
import ResourceArrayProperty from '../../Common/ResourceArrayProperty';
import { S3Service } from './S3Service';

interface S3State {
  isLoading: boolean;
  resourceId: string;
  isPublic: string;
  isEncrypted: string;
  lifecycleRuleIds: string[];
}

class S3Component extends React.Component<any, S3State> {
  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: false,
      resourceId: '',
      isPublic: '',
      isEncrypted: '',
      lifecycleRuleIds: [],
    };
    this.describe = this.describe.bind(this);
  }

  componentDidMount(): void {
    autorun(this.describe);
  }

  async describe() {
    this.startLoading();
    await this.loadProperties();
    this.endLoading();
  }

  private async loadProperties() {
    const s3Service = new S3Service();
    this.setState({
      isPublic: await s3Service.s3GetIsPublic(this.props.instanceId),
      isEncrypted: await s3Service.s3GetIsEncrypted(this.props.instanceId),
      lifecycleRuleIds: await s3Service.s3GetBucketLifecycleConfiguration(this.props.instanceId),
    });
  }

  private endLoading() {
    this.setState({
      isLoading: false,
    });
  }

  private startLoading() {
    this.setState({
      isLoading: true,
    });
  }

  render() {
    return (
      <ResourceCard title="S3" isLoading={this.state.isLoading}>
        <ResourceStringProperty name="Name" value={this.props.instanceId}/>
        <ResourceStringProperty name="IsPublic" value={this.state.isPublic}/>
        <ResourceStringProperty name="IsEncrypted" value={this.state.isEncrypted}/>
        <ResourceArrayProperty name="IsEncrypted" array={this.state.lifecycleRuleIds}/>
      </ResourceCard>
    );
  }
}

export default S3Component;
