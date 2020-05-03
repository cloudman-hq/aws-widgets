import * as React from "react";
import ECSCard from "./ECSCard";
import ECSProperty from "./ECSProperty";
import { ECSLogo } from "./amazon_ecs-icon.svg";

class ECS extends React.Component<any> {
  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <ECSCard title="Lambda" icon={ECSLogo}>
        <ECSProperty name={"Name"} value={this.props.name} />
        <ECSProperty name={"Role"} value={this.props.role} />
        <ECSProperty name={"Tags"} value={this.props.tags} />
        <ECSProperty name={"Runtime"} value={this.props.runtime} />
      </ECSCard>
    );
  }
}

export default ECS;
