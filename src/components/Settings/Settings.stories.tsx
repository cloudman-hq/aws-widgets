import * as React from 'react';

import SettingsComponent from '.';

export default {
  title: 'Settings',
  component: SettingsComponent,
};

export const Emoji = () => (
  <SettingsComponent />
);

Emoji.story = {
  name: 'Settings',
};
