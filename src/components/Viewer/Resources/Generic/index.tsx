import * as React from 'react';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import ResourceCard from '../../Common/ResourceCard';
import ResourceStringProperty from '../../Common/ResourceStringProperty';
import { findByName } from '../../../Aws/ResourceTypes';

// props: resourceType: string, resourceId: string
@observer
class GenericComponent extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: false,
      properties: {},
    };
    this.describe = this.describe.bind(this);
  }

  componentDidMount(): void {
    autorun(this.describe);
  }

  async describe() {
    const resourceType = findByName(this.props.resourceType);
    this.setState({ isLoading: true });
    const properties = await resourceType.properties(this.props.resourceId);
    this.setState({ properties, isLoading: false });
  }

  render() {
    return (
      <ResourceCard title={this.props.resourceType} isLoading={this.state.isLoading}>
        {Object.keys(this.state.properties).map(p =>
          <ResourceStringProperty name={p} value={this.state.properties[p]} key={p} />,
        )}
      </ResourceCard>
    );
  }
}

export default GenericComponent;