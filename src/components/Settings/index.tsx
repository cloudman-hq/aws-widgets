import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { Buttons, Container } from './style';

const Settings: React.FunctionComponent = ({ settingsStore }: any) => {
  const {
    saveSettings,
    loadSettings,
    onAccessKeyChange,
    onSecretKeyChange,
    accessKey,
    secretKey,
  } = settingsStore;
  return (
    <Container>
      <form className="aui top-label">
        <div className="field-group">
          <label htmlFor="accessKey">Access key</label>
          <input
            className="text"
            type="text"
            id="accessKey"
            name="accessKey"
            placeholder="Access key"
            value={accessKey}
            onChange={onAccessKeyChange} />
        </div>
        <div className="field-group">
          <label htmlFor="secretKey">Secret key</label>
          <input
            className="text medium-field"
            type="text"
            id="secretKey"
            name="secretKey"
            placeholder="Secret key"
            value={secretKey}
            onChange={onSecretKeyChange} />
        </div>
        <Buttons>
          <button onClick={saveSettings} className="aui-button aui-button-primary">
            Save
          </button>
          <button onClick={loadSettings} className="aui-button aui-button-primary">
            Load
          </button>
        </Buttons>
      </form>
    </Container>
  );
};

export default inject(({ rootStore }) => ({
  settingsStore: rootStore.getSettingsStore(),
}))(observer(Settings));