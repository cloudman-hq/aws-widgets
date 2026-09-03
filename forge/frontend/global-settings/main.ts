import { invoke } from '@forge/bridge';
import type { ResolverEnvelope } from '../../src/shared/contracts.js';
import { mountGlobalSettings } from '../../src/frontend/global-settings.js';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing app root');
void mountGlobalSettings(root, {
  invoke: (operation, payload) => invoke(operation, payload) as Promise<ResolverEnvelope<unknown>>,
}).catch(() => {
  root.textContent = 'AWS Widgets settings could not be loaded. Refresh the page to try again.';
});
