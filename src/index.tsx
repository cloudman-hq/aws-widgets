import * as React from 'react';
import * as ReactDom from 'react-dom';
import './styles/main';
import App from './components/App';
import { Provider } from 'mobx-react';
import RootStore from './store';
import {
  BrowserRouter as Router,
  Switch,
} from 'react-router-dom';
// tslint:disable-next-line: variable-name
const render = (Main: any) => {
  ReactDom.render(
    <React.StrictMode>
      <Provider rootStore={new RootStore()}>
        <Router>
          <Main />
        </Router>
      </Provider>
    </React.StrictMode>,
    document.querySelector('#app-root'));
};

render(App);

if ((module as any).hot) {
  (module as any).hot.accept('./components/App', () => {
    const nextApp = require('./components/App').default;
    render(nextApp);
  });
}
