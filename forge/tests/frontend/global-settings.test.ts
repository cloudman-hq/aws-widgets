// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolverEnvelope, ResolverOperation } from '../../src/shared/contracts.js';
import { mountGlobalSettings } from '../../src/frontend/global-settings.js';

type Invoke = (
  operation: ResolverOperation,
  payload: unknown,
) => Promise<ResolverEnvelope<unknown>>;

const success = <T>(data: T): ResolverEnvelope<T> => ({
  ok: true,
  data,
  requestId: 'request-test',
});

describe('global settings', () => {
  beforeEach(() => {
    document.head.replaceChildren();
    document.body.innerHTML = '<main id="app"></main>';
  });

  it('shows only configured status and accessible credential fields', async () => {
    const invoke = vi.fn<Invoke>().mockResolvedValue(success({
      configured: true,
      updatedAt: '2026-08-28T08:45:00.000Z',
    }));
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');

    await mountGlobalSettings(root, { invoke });

    expect(invoke).toHaveBeenCalledWith('credentials.status', {});
    expect(root.textContent).toContain('Credential configured');
    expect(root.querySelector<HTMLInputElement>('#access-key-id')?.type).toBe('text');
    expect(root.querySelector<HTMLInputElement>('#secret-access-key')?.type).toBe('password');
    expect(root.querySelector<HTMLInputElement>('#session-token')?.type).toBe('password');
    expect(root.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(root.textContent).not.toContain('AKIA');
  });

  it('saves entered credentials, then clears every secret from the completed DOM', async () => {
    const invoke = vi.fn<Invoke>()
      .mockResolvedValueOnce(success({ configured: false }))
      .mockResolvedValueOnce(success({
        configured: true,
        updatedAt: '2026-08-28T08:45:00.000Z',
      }));
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');
    await mountGlobalSettings(root, { invoke });

    const accessKey = root.querySelector<HTMLInputElement>('#access-key-id');
    const secretKey = root.querySelector<HTMLInputElement>('#secret-access-key');
    const sessionToken = root.querySelector<HTMLInputElement>('#session-token');
    const form = root.querySelector<HTMLFormElement>('form');
    if (!accessKey || !secretKey || !sessionToken || !form) throw new Error('form missing');
    accessKey.value = 'AKIAEXAMPLE12345678';
    secretKey.value = 'exampleSecretValueThatIsLongEnough123456';
    sessionToken.value = 'exampleSessionTokenThatIsLongEnough';

    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(root.textContent).toContain('Credential saved'));
    expect(invoke).toHaveBeenLastCalledWith('credentials.save', {
      accessKeyId: 'AKIAEXAMPLE12345678',
      secretAccessKey: 'exampleSecretValueThatIsLongEnough123456',
      sessionToken: 'exampleSessionTokenThatIsLongEnough',
    });
    expect(accessKey.value).toBe('');
    expect(secretKey.value).toBe('');
    expect(sessionToken.value).toBe('');
    expect(root.innerHTML).not.toContain('AKIAEXAMPLE12345678');
    expect(root.innerHTML).not.toContain('exampleSecretValueThatIsLongEnough123456');
    expect(root.innerHTML).not.toContain('exampleSessionTokenThatIsLongEnough');
  });

  it('deletes the installation credential and announces the empty state', async () => {
    const invoke = vi.fn<Invoke>()
      .mockResolvedValueOnce(success({ configured: true }))
      .mockResolvedValueOnce(success({ configured: false }));
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');
    await mountGlobalSettings(root, { invoke });

    const deleteButton = Array.from(root.querySelectorAll('button'))
      .find((button) => button.textContent === 'Delete credential');
    expect(deleteButton).toBeDefined();
    deleteButton?.click();

    await vi.waitFor(() => expect(root.textContent).toContain('Credential deleted'));
    expect(invoke).toHaveBeenLastCalledWith('credentials.delete', {});
  });

  it('moves keyboard focus to a specific save error and still clears secrets', async () => {
    const invoke = vi.fn<Invoke>()
      .mockResolvedValueOnce(success({ configured: false }))
      .mockResolvedValueOnce({
        ok: false,
        error: { code: 'INVALID_AUTH', retryable: false },
        requestId: 'request-error',
      });
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');
    await mountGlobalSettings(root, { invoke });
    const accessKey = root.querySelector<HTMLInputElement>('#access-key-id');
    const secretKey = root.querySelector<HTMLInputElement>('#secret-access-key');
    const form = root.querySelector<HTMLFormElement>('form');
    if (!accessKey || !secretKey || !form) throw new Error('form missing');
    accessKey.value = 'AKIAEXAMPLE12345678';
    secretKey.value = 'exampleSecretValueThatIsLongEnough123456';

    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(root.textContent).toContain('invalid or expired'));
    expect(document.activeElement).toBe(root.querySelector('[aria-live="polite"]'));
    expect(accessKey.value).toBe('');
    expect(secretKey.value).toBe('');
  });

  it('fails closed when the bridge rejects, clears secrets, and restores actions', async () => {
    const invoke = vi.fn<Invoke>()
      .mockResolvedValueOnce(success({ configured: false }))
      .mockRejectedValueOnce(new Error('raw bridge secret AKIALEAK'));
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');
    await mountGlobalSettings(root, { invoke });
    const accessKey = root.querySelector<HTMLInputElement>('#access-key-id');
    const secretKey = root.querySelector<HTMLInputElement>('#secret-access-key');
    const saveButton = Array.from(root.querySelectorAll('button'))
      .find((button) => button.textContent === 'Save credential');
    const form = root.querySelector<HTMLFormElement>('form');
    if (!accessKey || !secretKey || !saveButton || !form) throw new Error('form missing');
    accessKey.value = 'AKIAEXAMPLE12345678';
    secretKey.value = 'exampleSecretValueThatIsLongEnough123456';

    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(root.textContent).toContain('could not be saved'));
    expect(root.textContent).not.toContain('AKIALEAK');
    expect(accessKey.value).toBe('');
    expect(secretKey.value).toBe('');
    expect(saveButton.disabled).toBe(false);
    expect(document.activeElement).toBe(root.querySelector('[aria-live="polite"]'));
  });

  it('restores delete after a raw bridge rejection without exposing its message', async () => {
    const invoke = vi.fn<Invoke>()
      .mockResolvedValueOnce(success({ configured: true }))
      .mockRejectedValueOnce(new Error('raw delete details'));
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) throw new Error('test root missing');
    await mountGlobalSettings(root, { invoke });
    const deleteButton = Array.from(root.querySelectorAll('button'))
      .find((button) => button.textContent === 'Delete credential');
    if (!deleteButton) throw new Error('delete missing');

    deleteButton.click();

    await vi.waitFor(() => expect(root.textContent).toContain('could not be deleted'));
    expect(root.textContent).not.toContain('raw delete details');
    expect(deleteButton.disabled).toBe(false);
  });
});
