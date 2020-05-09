import * as React from 'react'
import Editor from ".";
import {Provider} from "mobx-react";
import RootStore from "../../RootStore";

export default {
    title: 'Editor',
    component: Editor
}

export const WithoutAccessKeyAndSecret = () =>
    <Provider rootStore={new RootStore()}>
        <Editor/>
    </Provider>;


export const WithAccessKeyAndSecret = () => {
    let rootStore = new RootStore();
    rootStore.getSettingsStore().setAccessKey("key")
    rootStore.getSettingsStore().setSecretKey("secret")
    return <Provider rootStore={rootStore}>
        <Editor/>
    </Provider>;
};
