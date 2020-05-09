import * as React from 'react'
import Editor from ".";
import {Provider} from "mobx-react";
import RootStore from "../../RootStore";

export default {
    title: 'Editor',
    component: Editor
}

function newRootStore() {
    return new RootStore();
}

export const WithoutAccessKeyAndSecret = () =>
    <Provider rootStore={newRootStore()}>
        <Editor/>
    </Provider>;


export const WithAccessKeyAndSecret = () => {
    let rootStore = newRootStore();
    rootStore.getSettingsStore().setAccessKey("key")
    rootStore.getSettingsStore().setSecretKey("secret")
    return <Provider rootStore={rootStore}>
        <Editor/>
    </Provider>;
};
