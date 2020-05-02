import AppStore from '../AppStore';

it('should know if region and and resource are set up', () => {
  // TODO: It should not require rootStore
  const appStore = new AppStore();
  expect(appStore.isRegionAndResourceSetup).toBeFalsy();
  appStore.setRegion('RGN');
  appStore.setResourceId('RID');
  expect(appStore.isRegionAndResourceSetup).toBeTruthy();
});
