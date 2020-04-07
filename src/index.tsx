import * as React from 'react';
import * as ReactDom from 'react-dom';
import './main';
import App from './components/App';

const render = (Main: React.FunctionComponent) => {
  ReactDom.render(
    <React.StrictMode>
      <Main />
    </React.StrictMode>,
    document.querySelector('#app-root'));
};

render(App);

if ((module as any).hot) {
  (module as any).hot.accept('./components/App', () => {
    const NextApp = require('./components/App').default;
    render(NextApp);
  });
}
