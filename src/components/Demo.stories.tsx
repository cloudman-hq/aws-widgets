import * as React from "react";
import ResourceCard from "./Viewer/Common/ResourceCard";
import ec2logo from "./Aws/icons/ec2.svg";

import Editor from "../components/Editor";
import { Provider } from "mobx-react";
import RootStore from "../RootStore";
import Settings from "./Settings";

export default {
  title: "Demo",
  component: ResourceCard,
};

const populateFromLocalStorage = (obj: any, key: string) => {
  const item = localStorage.getItem(key);
  if (item) {
    obj[key] = item;
  }
};

const rootStore = new RootStore();
populateFromLocalStorage(rootStore.getSettingsStore(), "accessKey");
populateFromLocalStorage(rootStore.getSettingsStore(), "secretKey");

const containerStyle = {
  display: "flex",
};
export const Demo = () => (
  <Provider rootStore={rootStore}>
    <div style={containerStyle}>
      <Settings />
      <Editor />
    </div>
  </Provider>
);

const isLoading = () => {
  return true;
};
const isNotLoading = () => {
  return false;
};
export const ResourceCardLoading = () => (
  <ResourceCard
    title="EC2"
    icon={ec2logo}
    isLoading={isLoading()}
  ></ResourceCard>
);

export const ResourceCardLoaded = () => (
  <ResourceCard
    title="EC2"
    icon={ec2logo}
    isLoading={isNotLoading()}
  ></ResourceCard>
);
