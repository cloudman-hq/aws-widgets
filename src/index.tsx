import * as React from 'react';
import * as ReactDom from 'react-dom';
import './styles/main';
import App from './components/App';
import { Provider } from 'mobx-react';
import RootStore from './store';
import { BrowserRouter as Router } from 'react-router-dom';
// tslint:disable-next-line: variable-name
const rootStore = new RootStore();
const render = (Main: any) => {
  ReactDom.render(
    <React.StrictMode>
      <Provider rootStore={rootStore}>
        <Router>
          <Main />
        </Router>
      </Provider>
    </React.StrictMode>,
    document.querySelector('#app-root'));
};

render(App);
// @ts-ignore
window.rootStore = rootStore;
if ((module as any).hot) {
  (module as any).hot.accept('./components/App', () => {
    const nextApp = require('./components/App').default;
    render(nextApp);
  });
}
