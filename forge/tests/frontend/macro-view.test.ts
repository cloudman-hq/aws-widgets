// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolverEnvelope, ResolverOperation } from '../../src/shared/contracts.js';
import { mountMacroView } from '../../src/frontend/macro-view.js';

type Invoke = (
  operation: ResolverOperation,
  payload: unknown,
) => Promise<ResolverEnvelope<unknown>>;

const success = <T>(data: T): ResolverEnvelope<T> => ({
  ok: true,
  data,
  requestId: 'request-test',
});

const config = {
  schemaVersion: 1 as const,
  region: 'ap-southeast-2' as const,
  resourceType: 'ec2' as const,
  resourceId: 'i-0123456789abcdef0',
};

describe('macro view', () => {
  beforeEach(() => {
    document.head.replaceChildren();
    document.body.innerHTML = '<main id="app"></main>';
  });

  it('renders the normalized resource as text with its region/type coordinate', async () => {
    const invoke = vi.fn<Invoke>().mockResolvedValue(success({
      schemaVersion: 1,
      resourceType: 'ec2',
      resourceId: config.resourceId,
      region: config.region,
      title: 'EC2 instance',
      fields: [
        { key: 'state', label: 'State', value: 'running' },
        { key: 'tags', label: 'Tags', value: ['env: production', 'team: platform'] },
      ],
      observedAt: '2026-08-28T08:45:00.000Z',
    }));
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');

    await mountMacroView(root, {
      invoke,
      getContext: async () => ({ extension: { config } }),
    });

    expect(invoke).toHaveBeenCalledWith('resource.describe', config);
    expect(root.querySelector('[data-coordinate-strip]')?.textContent)
      .toContain('ap-southeast-2 × EC2');
    expect(root.textContent).toContain('EC2 instance');
    expect(root.textContent).toContain('running');
    expect(root.textContent).toContain('env: production');
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('[aria-live="polite"]')).not.toBeNull();
  });

  it('directs legacy or unconfigured macros to explicit reconfiguration without calling AWS', async () => {
    const invoke = vi.fn<Invoke>();
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');

    await mountMacroView(root, {
      invoke,
      getContext: async () => ({ extension: { config: {} } }),
    });

    expect(root.textContent).toContain('Configure this macro');
    expect(root.textContent).toContain('Existing Connect settings are not copied');
    expect(invoke).not.toHaveBeenCalled();
  });

  it.each([
    ['INVALID_INPUT', 'configuration is invalid', false],
    ['UNAUTHORIZED', 'do not have access', false],
    ['NOT_CONFIGURED', 'credential is not configured', false],
    ['INVALID_AUTH', 'credential is invalid or expired', false],
    ['PERMISSION_DENIED', 'denied access', false],
    ['NOT_FOUND', 'was not found', false],
    ['THROTTLED', 'limiting requests', true],
    ['NETWORK_ERROR', 'could not be reached', true],
    ['RESULT_LIMIT', 'too many resources', false],
    ['INTERNAL_ERROR', 'could not be loaded', true],
  ] as const)(
    'renders the %s state with correct retry availability',
    async (code, expectedCopy, retryable) => {
      const invoke = vi.fn<Invoke>().mockResolvedValue({
        ok: false,
        error: { code, retryable },
        requestId: 'request-error',
      });
      const root = document.querySelector<HTMLElement>('#app');
      if (!root) throw new Error('test root missing');

      await mountMacroView(root, {
        invoke,
        getContext: async () => ({ extension: { config } }),
      });

      expect(root.textContent?.toLowerCase()).toContain(expectedCopy);
      const retry = Array.from(root.querySelectorAll('button'))
        .find((button) => button.textContent === 'Try again');
      expect(Boolean(retry)).toBe(retryable);
    },
  );

  it('retries a retryable failure and replaces it with the recovered resource', async () => {
    const invoke = vi.fn<Invoke>()
      .mockResolvedValueOnce({
        ok: false,
        error: { code: 'NETWORK_ERROR', retryable: true },
        requestId: 'request-error',
      })
      .mockResolvedValueOnce(success({
        schemaVersion: 1,
        resourceType: 'ec2',
        resourceId: config.resourceId,
        region: config.region,
        title: 'Recovered instance',
        fields: [{ key: 'state', label: 'State', value: 'running' }],
        observedAt: '2026-08-28T08:45:00.000Z',
      }));
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');
    await mountMacroView(root, {
      invoke,
      getContext: async () => ({ extension: { config } }),
    });

    const retry = Array.from(root.querySelectorAll('button'))
      .find((button) => button.textContent === 'Try again');
    retry?.click();

    await vi.waitFor(() => expect(root.textContent).toContain('Recovered instance'));
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(root.textContent).not.toContain('could not be reached');
    expect(root.querySelector('button')).toBeNull();
  });

  it('announces loading while context and resource data are pending', async () => {
    let resolveContext: ((value: unknown) => void) | undefined;
    const context = new Promise<unknown>((resolve) => { resolveContext = resolve; });
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');
    const mounted = mountMacroView(root, {
      invoke: vi.fn<Invoke>().mockResolvedValue(success({
        schemaVersion: 1,
        resourceType: 'ec2',
        resourceId: config.resourceId,
        region: config.region,
        title: 'Instance',
        fields: [],
        observedAt: '2026-08-28T08:45:00.000Z',
      })),
      getContext: () => context,
    });

    expect(root.textContent).toContain('Loading AWS resource');
    resolveContext?.({ extension: { config } });
    await mounted;
  });

  it('turns a raw bridge rejection into a safe retryable state and can recover', async () => {
    const invoke = vi.fn<Invoke>()
      .mockRejectedValueOnce(new Error('raw AWS account and request details'))
      .mockResolvedValueOnce(success({
        schemaVersion: 1,
        resourceType: 'ec2',
        resourceId: config.resourceId,
        region: config.region,
        title: 'Recovered safely',
        fields: [],
        observedAt: '2026-08-28T08:45:00.000Z',
      }));
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');

    await mountMacroView(root, {
      invoke,
      getContext: async () => ({ extension: { config } }),
    });

    expect(root.textContent).toContain('could not be loaded');
    expect(root.textContent).not.toContain('raw AWS account');
    const retry = Array.from(root.querySelectorAll('button'))
      .find((button) => button.textContent === 'Try again');
    expect(retry).toBeDefined();
    retry?.click();
    await vi.waitFor(() => expect(root.textContent).toContain('Recovered safely'));
  });
});
