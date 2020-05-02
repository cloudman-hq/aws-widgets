import * as React from 'react'
import Editor from ".";
import {Provider} from "mobx-react";
import RootStore from "../../RootStore";

export default {
    title: 'Editor',
    component: Editor
}

let rootStore = new RootStore();

export const EditorWithoutAccessKeyAndSecret = () => {
    return (
        <Provider rootStore={rootStore}>
            <Editor/>
        </Provider>
    );
};
