import * as React from "react";
import * as AWS from "aws-sdk";
import Lambda from "../../components/Lambda";
import EC2 from "../../components/EC2";
import { inject, observer } from "mobx-react";
import Viewer from "../Viewer";

interface State {
  resourceId: string;
  resourceType: string;
  resourceDescription: any;
}

@inject(({ rootStore }) => ({
  appStore: rootStore.getAppStore(),
  settingsStore: rootStore.getSettingsStore(),
}))
@observer
class Editor extends React.Component<any, State> {
  constructor(props: any) {
    super(props);

    this.state = {
      resourceId: "",
      resourceType: "unknown",
      resourceDescription: {},
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.describe = this.describe.bind(this);
  }

  handleInputChange(event: React.FormEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;

    this.setState({
      resourceId: value,
    });
  }

  describe(e: any) {
    e.preventDefault();
    AWS.config.region = "ap-southeast-2";

    AWS.config.credentials = new AWS.Credentials(
      this.props.settingsStore.accessKey,
      this.props.settingsStore.secretKey
    );
    const resourceId = this.state.resourceId;
    this.props.appStore.setResourceId(resourceId);
  }

  render() {
    let resourceCard;
    if (this.state.resourceType === "lambda") {
      resourceCard = (
        <Lambda
          runtime={this.props.appStore.resourceDescription.lambdaRuntime}
          role={this.props.appStore.resourceDescription.lambdaRole}
          name={this.props.appStore.resourceDescription.lambdaName}
          tags={this.props.appStore.tags}
        />
      );
    } else {
      resourceCard = (
        <EC2
          availabilityZone={this.state.resourceDescription.availabilityZone}
          resourceState={this.state.resourceDescription.resourceState}
        />
      );
    }
    return (
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          ARN or Resource ID:
          <input
            className="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal"
            name="resourceId"
            type="string"
            placeholder="e.g. i-04308dbefa6eb6ac"
            value={this.state.resourceId}
            onChange={this.handleInputChange}
          />
        </label>

        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={this.describe}
        >
          Describe
        </button>
        <div className="border rounded leading-normal mt-5 px-4 py-2 max-w-sm w-full lg:max-w-full lg:flex">
          <Viewer />
        </div>
      </div>
    );
  }
}

export default Editor;
