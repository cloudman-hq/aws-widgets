import * as React from 'react'
import Editor from ".";
import {Provider} from "mobx-react";
import RootStore from "../../RootStore";

export default {
    title: 'Editor',
    component: Editor
}

let rootStore = new RootStore();

export const WithoutAccessKeyAndSecret = () =>
    <Provider rootStore={rootStore}>
        <Editor/>
    </Provider>;

    export const WithAccessKeyAndSecret = () => {
        rootStore.getSettingsStore().setAccessKey("key")
        rootStore.getSettingsStore().setSecretKey("secret")
        return <Provider rootStore={rootStore}>
            <Editor/>
        </Provider>;
    };
