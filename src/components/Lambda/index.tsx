import * as React from "react";
import { LambdaCard } from './style';
import '../../styles/style.css';

class Lambda extends React.Component<any> {
  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <LambdaCard className="resource-root lambda">
        <div className="property" >
          <label  className="field-name resource-logo">Name</label> <span className="field-icon lambda"/>
          <span className="field-value">{this.props.name}</span>
        </div>
        <div className="property" >
          <label  className="field-name runtime">Runtime</label> <span className="field-icon runtime"/>
          <span >{this.props.runtime}</span>
        </div>
        <div className="property" >
          <label  className="field-name role">Role</label> <span className="icon role"/>
          <span>{this.props.role}</span>
        </div>
        <div className="property" >
          <label  className="field-name role">Tags</label> <span className="icon role"/>
          <span>{this.props.tags}</span>
        </div>
      </LambdaCard>
    );
  }
}

export default Lambda;
