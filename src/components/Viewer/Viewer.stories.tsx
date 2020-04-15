import * as React from 'react'
import Editor from ".";
// import '../../styles/app.css';

export default {
  title: 'Editor',
  component: Editor
}

export const EditorDemo = () => (
  <Editor accessKey="Test" secretKey="Role"/>
);
