import { SettingsStore } from '../SettingsStore';

it('should know if the access is set up', () => {
  const settingsStore = new SettingsStore();
  expect(settingsStore.isAccessSetup).toBeFalsy();
  settingsStore.setAccessKey('A');
  settingsStore.setSecretKey('B');
  expect(settingsStore.isAccessSetup).toBeTruthy();
});

it('should returns a set of AWS Credential', () => {
  const settingsStore = new SettingsStore();
  expect(settingsStore.awsCredentials).toBeNull();
  settingsStore.setAccessKey('A');
  settingsStore.setSecretKey('B');
  expect(settingsStore.awsCredentials.accessKeyId).toBe('A');
  expect(settingsStore.awsCredentials.secretAccessKey).toBe('B');
});
