import { invoke, view } from '@forge/bridge';
import type { ResolverEnvelope } from '../../src/shared/contracts.js';
import { mountMacroView } from '../../src/frontend/macro-view.js';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing app root');
void mountMacroView(root, {
  invoke: (operation, payload) => invoke(operation, payload) as Promise<ResolverEnvelope<unknown>>,
  getContext: view.getContext,
}).catch(() => {
  root.textContent = 'AWS resource could not be loaded. Refresh the page to try again.';
});
