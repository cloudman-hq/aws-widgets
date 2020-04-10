import * as React from 'react';
import * as ReactDom from 'react-dom';
import './main';
import App from './components/App';
import { Provider } from 'mobx-react';
import RootStore from './store';
import {
  BrowserRouter as Router,
  Switch,
} from 'react-router-dom';
const render = (Main: any) => {
  ReactDom.render(
    <React.StrictMode>
      <Provider rootStore={new RootStore()}>
        <Router>
          <Switch>
            <Main />
          </Switch>
        </Router>
      </Provider>
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
