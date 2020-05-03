import * as React from "react";
import ECSCard from "./ECSCard";
import ECSProperty from "./ECSProperty";
import ECSLogo from "./amazon_ecs-icon.svg";

class ECS extends React.Component<any> {
  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <ECSCard title="ECS" icon={ECSLogo}>
        <ECSProperty name={"clusterName"} value={this.props.clusterName} />
        <ECSProperty name={"Serices"} value={this.props.serices} />
        <ECSProperty name={"Tasks"} value={this.props.tasks} />
      </ECSCard>
    );
  }
}

export default ECS;
