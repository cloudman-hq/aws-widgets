import * as React from 'react';
import { autorun } from 'mobx';
import ResourceCard from '../../Common/ResourceCard';
import ResourceStringProperty from '../../Common/ResourceStringProperty';
import ResourceArrayProperty from '../../Common/ResourceArrayProperty';
import { S3Service } from './S3Service';
import ResourceMapProperty from '../../Common/ResourceMapProperty';

interface S3State {
  isLoading: boolean;
  resourceId: string;
  isPublic: string;
  isEncrypted: string;
  lifecycleRuleIds: string[];
  policy: string;
  tags: Map<string, string>;
}

class S3Viewer extends React.Component<any, S3State> {
  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: false,
      resourceId: '',
      isPublic: '',
      isEncrypted: '',
      lifecycleRuleIds: [],
      policy: '',
      tags: new Map<string, string>(),
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
      isPublic: await s3Service.s3GetIsPublic(this.props.bucketName),
      isEncrypted: await s3Service.s3GetIsEncrypted(this.props.bucketName),
      lifecycleRuleIds: await s3Service.s3GetBucketLifecycleConfiguration(this.props.bucketName),
      policy: await s3Service.s3GetBucketPolicy(this.props.bucketName),
      tags: await s3Service.s3GetBucketTagging(this.props.bucketName),
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
        <ResourceStringProperty name="Name" value={this.props.bucketName}/>
        <ResourceStringProperty name="IsPublic" value={this.state.isPublic}/>
        <ResourceStringProperty name="IsEncrypted" value={this.state.isEncrypted}/>
        <ResourceArrayProperty name="LifecycleRules" array={this.state.lifecycleRuleIds}/>
        <ResourceStringProperty name="Policy" value={this.state.policy}/>
        <ResourceMapProperty name="Tags" map={this.state.tags}/>
      </ResourceCard>
    );
  }
}

export default S3Viewer;
