import * as React from 'react'
import Viewer from ".";
import RootStore from "../../RootStore";
import {Provider} from "mobx-react";
// import '../../styles/app.css';

export default {
    title: 'Viewer',
    component: Viewer
}

let rootStore = new RootStore();

export const ViewerDemo = () => (
    <Provider rootStore={rootStore}>
        <Viewer/>
    </Provider>
);
