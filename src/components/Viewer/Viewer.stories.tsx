import * as React from 'react'
import Viewer from ".";
// import '../../styles/app.css';

export default {
  title: 'Viewer',
  component: Viewer
}

export const ViewerDemo = () => (
  <Viewer accessKey="Test" secretKey="Role"/>
);
