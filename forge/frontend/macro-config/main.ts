import { invoke, view } from '@forge/bridge';
import type { ResolverEnvelope } from '../../src/shared/contracts.js';
import { mountMacroConfig } from '../../src/frontend/macro-config.js';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing app root');
void mountMacroConfig(root, {
  invoke: (operation, payload) => invoke(operation, payload) as Promise<ResolverEnvelope<unknown>>,
  getContext: view.getContext,
  submit: view.submit,
}).catch(() => {
  root.textContent = 'Macro configuration could not be loaded. Close the editor and try again.';
});
