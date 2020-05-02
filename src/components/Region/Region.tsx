import * as React from "react";
import {Simulate} from "react-dom/test-utils";
import {inject, observer} from "mobx-react";
interface State {
  value: string
}

class Region extends React.Component<any, State> {
  constructor(props: any) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  render() {
    const region = this.props.appStore.getRegion();
    return (
      <div>
        <label>Region:</label>
        <input
          value={region}
          aria-label="region-input"
          onChange={this.handleChange}
        />
      </div>
    )
  }

  private handleChange(e: any) {
    e.preventDefault();
    this.props.appStore.setRegion(e.currentTarget.value);
  }
}

export default Region;
