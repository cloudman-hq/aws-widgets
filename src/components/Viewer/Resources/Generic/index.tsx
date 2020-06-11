import * as React from 'react';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import ResourceCard from '../../Common/ResourceCard';
import ResourceStringProperty from '../../Common/ResourceStringProperty';
import ResourceListProperty from '../../Common/ResourceListProperty';
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
    if (resourceType) {
      this.setState({ isLoading: true });
      const properties = await resourceType.properties(this.props.resourceId);
      this.setState({ properties, icon: resourceType.icon, isLoading: false });
    }
  }

  renderProperty(key: string, value: any) {
    const isArray = value instanceof Array;
    if (isArray) {
      return (<ResourceListProperty name={key} value={value} key={key} />);
    }
    return (<ResourceStringProperty name={key} value={value} key={key} />);
  }

  renderProperties(properties: any) {
    if (properties.html) {
      return (<span dangerouslySetInnerHTML={{ __html: properties.html }} />);
    }
    return Object.keys(properties).map(p =>
      this.renderProperty(p, properties[p]));
  }

  render() {
    return (
      <ResourceCard title={this.props.resourceType}
        icon={this.state.icon} isLoading={this.state.isLoading}>
        {this.renderProperties(this.state.properties)}
      </ResourceCard>
    );
  }
}

export default GenericComponent;
