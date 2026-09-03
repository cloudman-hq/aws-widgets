import type {
  MacroConfigV1,
  ResolverEnvelope,
  ResolverOperation,
} from '../../src/shared/contracts.js';
import { mountGlobalSettings } from '../../src/frontend/global-settings.js';
import { mountMacroConfig } from '../../src/frontend/macro-config.js';
import { mountMacroView } from '../../src/frontend/macro-view.js';

const success = <T>(data: T): ResolverEnvelope<T> => ({
  ok: true,
  data,
  requestId: 'local-harness',
});

const config: MacroConfigV1 = {
  schemaVersion: 1,
  region: 'ap-southeast-2',
  resourceType: 'lambda',
  resourceId: 'arn:aws:lambda:ap-southeast-2:123456789012:function:invoice-worker',
};

const invoke = async (
  operation: ResolverOperation,
  payload: Record<string, unknown>,
): Promise<ResolverEnvelope<unknown>> => {
  void payload;
  switch (operation) {
    case 'analytics.track':
      return success({ tracked: true });
    case 'credentials.status':
      return success({ configured: true, updatedAt: '2026-08-28T08:45:00.000Z' });
    case 'credentials.save':
      return success({ configured: true, updatedAt: '2026-08-28T08:45:00.000Z' });
    case 'credentials.delete':
      return success({ configured: false });
    case 'resource.describe':
      return success({
        schemaVersion: 1,
        resourceType: 'lambda',
        resourceId: config.resourceId,
        region: 'ap-southeast-2',
        title: 'invoice-worker',
        fields: [
          { key: 'runtime', label: 'Runtime', value: 'nodejs24.x' },
          { key: 'status', label: 'Last update', value: 'Successful' },
          { key: 'role', label: 'Execution role', value: 'arn:aws:iam::123456789012:role/invoice-worker-readonly' },
          { key: 'tags', label: 'Tags', value: ['environment: production', 'owner: billing'] },
        ],
        observedAt: '2026-08-28T08:45:00.000Z',
      });
  }
};

const settings = document.querySelector<HTMLElement>('#settings');
const macroConfig = document.querySelector<HTMLElement>('#config');
const view = document.querySelector<HTMLElement>('#view');
if (!settings || !macroConfig || !view) throw new Error('Harness roots are missing');

await Promise.all([
  mountGlobalSettings(settings, { invoke }),
  mountMacroConfig(macroConfig, {
    invoke,
    getContext: async () => ({ extension: { config } }),
    submit: async () => undefined,
  }),
  mountMacroView(view, {
    invoke,
    getContext: async () => ({ extension: { config } }),
  }),
]);

const harnessStyle = document.createElement('style');
harnessStyle.textContent = `
  .harness-heading {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 20px;
    border-bottom: 1px solid #cbd3dc;
    background: #17202a;
    color: #fff;
    font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .harness-heading span { color: #b9c3ce; }
  .harness-grid { display: grid; grid-template-columns: repeat(3, minmax(340px, 1fr)); gap: 1px; background: #cbd3dc; }
  .harness-grid > section { min-width: 0; background: #f4f7fa; }
  .harness-grid .aws-shell { padding: 20px; }
  @media (max-width: 1100px) { .harness-grid { grid-template-columns: 1fr; } }
`;
document.head.append(harnessStyle);
