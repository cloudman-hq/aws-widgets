// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolverEnvelope, ResolverOperation } from '../../src/shared/contracts.js';
import { mountMacroConfig } from '../../src/frontend/macro-config.js';

type Invoke = (
  operation: ResolverOperation,
  payload: unknown,
) => Promise<ResolverEnvelope<unknown>>;

const success = <T>(data: T): ResolverEnvelope<T> => ({
  ok: true,
  data,
  requestId: 'request-test',
});

describe('macro configuration', () => {
  beforeEach(() => {
    document.head.replaceChildren();
    document.body.innerHTML = '<main id="app"></main>';
  });

  it('loads existing configuration into accessible fields and the coordinate strip', async () => {
    const invoke = vi.fn<Invoke>().mockResolvedValue(success({ items: [], truncated: false }));
    const getContext = vi.fn().mockResolvedValue({
      extension: {
        config: {
          schemaVersion: 1,
          region: 'ap-southeast-2',
          resourceType: 'ec2',
          resourceId: 'i-0123456789abcdef0',
        },
      },
    });
    const submit = vi.fn().mockResolvedValue(undefined);
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');

    await mountMacroConfig(root, { invoke, getContext, submit });

    expect(root.querySelector<HTMLSelectElement>('#region')?.value).toBe('ap-southeast-2');
    expect(root.querySelector<HTMLSelectElement>('#resource-type')?.value).toBe('ec2');
    expect(root.querySelector<HTMLInputElement>('#resource-id')?.value).toBe('i-0123456789abcdef0');
    expect(root.querySelector('[data-coordinate-strip]')?.textContent)
      .toContain('ap-southeast-2 × EC2');
    expect(root.querySelector('[aria-live="polite"]')).not.toBeNull();
  });

  it('prepopulates the editor from an existing Connect macro so saving preserves its behavior', async () => {
    const invoke = vi.fn<Invoke>(async (operation: ResolverOperation) => operation === 'macro.config.resolve'
      ? success({
          source: 'connect',
          config: {
            schemaVersion: 1,
            region: 'us-east-1',
            resourceType: 'lambda',
            resourceId: 'arn:aws:lambda:us-east-1:123456789012:function:orders',
          },
        })
      : success({ items: [], truncated: false }));
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');

    await mountMacroConfig(root, {
      invoke,
      getContext: async () => ({ extension: { config: { uuid: 'legacy-uuid' } } }),
      submit: async () => undefined,
    });

    expect(invoke).toHaveBeenCalledWith('macro.config.resolve', {});
    expect(root.querySelector<HTMLSelectElement>('#region')?.value).toBe('us-east-1');
    expect(root.querySelector<HTMLSelectElement>('#resource-type')?.value).toBe('lambda');
    expect(root.querySelector<HTMLInputElement>('#resource-id')?.value)
      .toBe('arn:aws:lambda:us-east-1:123456789012:function:orders');
  });

  it('requires an explicit region and resource type for a new macro', async () => {
    const invoke = vi.fn<Invoke>();
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');
    await mountMacroConfig(root, {
      invoke,
      getContext: async () => ({ extension: { config: {} } }),
      submit: async () => undefined,
    });

    expect(root.querySelector<HTMLSelectElement>('#region')?.value).toBe('');
    expect(root.querySelector<HTMLSelectElement>('#resource-type')?.value).toBe('');
    expect(root.querySelector('[data-coordinate-strip]')?.textContent).toContain('REGION × TYPE');
    expect(root.textContent).toContain('Choose a region and resource type');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('loads normalized resource choices when the region or type changes', async () => {
    const invoke = vi.fn<Invoke>().mockResolvedValue(success({
      items: [{ id: 'arn:aws:lambda:us-east-1:123456789012:function:orders', label: 'orders' }],
      truncated: false,
    }));
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');
    await mountMacroConfig(root, {
      invoke,
      getContext: async () => ({ extension: { config: {} } }),
      submit: async () => undefined,
    });

    const region = root.querySelector<HTMLSelectElement>('#region');
    const resourceType = root.querySelector<HTMLSelectElement>('#resource-type');
    if (!region || !resourceType) throw new Error('selectors missing');
    region.value = 'us-east-1';
    resourceType.value = 'lambda';
    resourceType.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() => expect(root.querySelectorAll('datalist option')).toHaveLength(1));
    expect(invoke).toHaveBeenLastCalledWith('resource.list', {
      region: 'us-east-1',
      resourceType: 'lambda',
    });
    expect(root.querySelector('datalist option')?.getAttribute('value'))
      .toBe('arn:aws:lambda:us-east-1:123456789012:function:orders');
    expect(root.querySelector<HTMLInputElement>('#resource-id')?.list?.id)
      .toBe('resource-options');
  });

  it('submits the versioned macro configuration and announces completion', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');
    await mountMacroConfig(root, {
      invoke: vi.fn<Invoke>().mockResolvedValue(success({ items: [], truncated: false })),
      getContext: async () => ({ extension: { config: {} } }),
      submit,
    });

    const region = root.querySelector<HTMLSelectElement>('#region');
    const resourceType = root.querySelector<HTMLSelectElement>('#resource-type');
    const resourceId = root.querySelector<HTMLInputElement>('#resource-id');
    const form = root.querySelector<HTMLFormElement>('form');
    if (!region || !resourceType || !resourceId || !form) throw new Error('form missing');
    region.value = 'eu-west-1';
    resourceType.value = 'dynamodb';
    resourceId.value = 'orders';
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(submit).toHaveBeenCalledWith({
      config: {
        schemaVersion: 1,
        region: 'eu-west-1',
        resourceType: 'dynamodb',
        resourceId: 'orders',
      },
    }));
    expect(root.textContent).toContain('Resource saved');
  });

  it('turns a raw list rejection into safe manual-entry guidance', async () => {
    const invoke = vi.fn<Invoke>().mockRejectedValue(new Error('raw list account detail'));
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');
    await mountMacroConfig(root, {
      invoke,
      getContext: async () => ({ extension: { config: {} } }),
      submit: async () => undefined,
    });
    const region = root.querySelector<HTMLSelectElement>('#region');
    const resourceType = root.querySelector<HTMLSelectElement>('#resource-type');
    if (!region || !resourceType) throw new Error('selectors missing');
    region.value = 'ap-southeast-2';
    resourceType.value = 'lambda';
    resourceType.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() => expect(root.textContent).toContain('Enter an identifier manually'));
    expect(root.textContent).not.toContain('raw list account detail');
  });

  it('restores save after a raw submit rejection without exposing its message', async () => {
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');
    await mountMacroConfig(root, {
      invoke: vi.fn<Invoke>().mockResolvedValue(success({ items: [], truncated: false })),
      getContext: async () => ({
        extension: {
          config: {
            schemaVersion: 1,
            region: 'ap-southeast-2',
            resourceType: 'ec2',
            resourceId: 'i-0123456789abcdef0',
          },
        },
      }),
      submit: async () => { throw new Error('raw submit details'); },
    });
    const form = root.querySelector<HTMLFormElement>('form');
    const save = root.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!form || !save) throw new Error('form missing');

    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(root.textContent).toContain('was not saved'));
    expect(root.textContent).not.toContain('raw submit details');
    expect(save.disabled).toBe(false);
    expect(document.activeElement).toBe(root.querySelector('[aria-live="polite"]'));
  });
});
