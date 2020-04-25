import * as React from 'react'
import Editor from ".";
import RootStore from "../../RootStore";
import {Provider} from "mobx-react";
import {storiesOf} from "@storybook/react";


const withProvider = (story: any) => {
  let rootStore = new RootStore();
  rootStore.getAppStore()
  rootStore.getSettingsStore().setAccessKey("key")
  rootStore.getSettingsStore().setSecretKey("secret")
  return (
      <Provider rootStore={rootStore}>
        {story()}
      </Provider>
  );
}

storiesOf('Editor', module)
    .addDecorator(withProvider)
    .add('default', () => (
          <Editor />
    ));
