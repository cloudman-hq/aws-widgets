import type {
  CredentialStatus,
  PublicErrorCode,
  ResolverEnvelope,
  ResolverOperation,
} from '../shared/contracts.js';
import { installTheme, setCoordinate, setStatus } from './theme.js';

type Invoke = (
  operation: ResolverOperation,
  payload: Record<string, unknown>,
) => Promise<ResolverEnvelope<unknown>>;

export type GlobalSettingsDependencies = { invoke: Invoke };

const SAVE_ERROR_MESSAGES: Record<PublicErrorCode, string> = {
  INVALID_INPUT: 'The credential fields are invalid. Check each value and try again.',
  UNAUTHORIZED: 'You do not have access to change this credential.',
  NOT_CONFIGURED: 'The AWS credential is not configured.',
  INVALID_AUTH: 'The AWS credential is invalid or expired. Check the values and try again.',
  PERMISSION_DENIED: 'AWS denied credential validation.',
  NOT_FOUND: 'AWS could not validate this credential.',
  THROTTLED: 'AWS is limiting validation requests. Try again in a moment.',
  NETWORK_ERROR: 'AWS could not be reached. Check the connection and try again.',
  RESULT_LIMIT: 'The credential could not be saved.',
  INTERNAL_ERROR: 'The credential could not be saved. Try again.',
};

const input = (
  id: string,
  name: string,
  labelText: string,
  type: 'text' | 'password',
): HTMLLabelElement => {
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  label.className = 'field';
  const field = document.createElement('input');
  field.id = id;
  field.name = name;
  field.type = type;
  field.autocomplete = 'off';
  if (name !== 'sessionToken') field.required = true;
  label.append(field);
  return label;
};

const clearCredentialFields = (form: HTMLFormElement): void => {
  for (const name of ['accessKeyId', 'secretAccessKey', 'sessionToken']) {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLInputElement) field.value = '';
  }
};

export async function mountGlobalSettings(
  root: HTMLElement,
  { invoke }: GlobalSettingsDependencies,
): Promise<void> {
  installTheme();
  root.replaceChildren();
  root.className = 'aws-shell aws-shell--settings';

  const header = document.createElement('header');
  header.className = 'surface-header';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'surface-eyebrow';
  eyebrow.textContent = 'Installation scope';
  const heading = document.createElement('h1');
  heading.className = 'surface-title';
  heading.textContent = 'AWS credential';
  const intro = document.createElement('p');
  intro.className = 'surface-intro';
  intro.textContent = 'One read-only credential is held for this Forge installation. Stored values stay in the backend and are never loaded back into this page.';
  header.append(eyebrow, heading, intro);

  const coordinate = document.createElement('p');
  coordinate.className = 'coordinate-strip';
  setCoordinate(coordinate, 'INSTALLATION', 'AWS ACCOUNT');
  const liveStatus = document.createElement('p');
  liveStatus.className = 'status-rail';
  liveStatus.setAttribute('aria-live', 'polite');
  liveStatus.tabIndex = -1;
  setStatus(liveStatus, 'Checking credential status…', 'busy');

  const form = document.createElement('form');
  form.className = 'surface-panel';
  const fieldGrid = document.createElement('div');
  fieldGrid.className = 'field-grid';
  fieldGrid.append(
    input('access-key-id', 'accessKeyId', 'Access key ID', 'text'),
    input('secret-access-key', 'secretAccessKey', 'Secret access key', 'password'),
    input('session-token', 'sessionToken', 'Session token (optional)', 'password'),
  );
  fieldGrid.lastElementChild?.classList.add('field--wide');
  const hint = document.createElement('p');
  hint.className = 'field-hint field--wide';
  hint.textContent = 'Saving validates with AWS, then replaces the previous installation credential. Leave session token empty for long-lived access keys.';
  fieldGrid.append(hint);
  const saveButton = document.createElement('button');
  saveButton.type = 'submit';
  saveButton.textContent = 'Save credential';
  saveButton.className = 'button button--primary';
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.textContent = 'Delete credential';
  deleteButton.disabled = true;
  deleteButton.className = 'button button--danger';
  const actions = document.createElement('div');
  actions.className = 'surface-actions';
  actions.append(saveButton, deleteButton);
  form.append(fieldGrid, actions);

  const securityNote = document.createElement('p');
  securityNote.className = 'security-note';
  securityNote.textContent = 'Use a dedicated least-privilege AWS identity. The app reads resource metadata only; it does not need create, update, delete, invoke, or S3 object access.';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const accessKeyId = String(formData.get('accessKeyId') ?? '');
    const secretAccessKey = String(formData.get('secretAccessKey') ?? '');
    const sessionToken = String(formData.get('sessionToken') ?? '');
    const payload = sessionToken.length > 0
      ? { accessKeyId, secretAccessKey, sessionToken }
      : { accessKeyId, secretAccessKey };

    saveButton.disabled = true;
    setStatus(liveStatus, 'Validating and saving credential…', 'busy');
    try {
      const saveResponse = await invoke('credentials.save', payload);
      setStatus(
        liveStatus,
        saveResponse.ok ? 'Credential saved' : SAVE_ERROR_MESSAGES[saveResponse.error.code],
        saveResponse.ok ? 'success' : 'danger',
      );
      if (saveResponse.ok) deleteButton.disabled = false;
      else liveStatus.focus();
    } catch {
      setStatus(liveStatus, 'The credential could not be saved. Try again.', 'danger');
      liveStatus.focus();
    } finally {
      clearCredentialFields(form);
      saveButton.disabled = false;
    }
  });

  deleteButton.addEventListener('click', async () => {
    deleteButton.disabled = true;
    setStatus(liveStatus, 'Deleting credential…', 'busy');
    try {
      const deleteResponse = await invoke('credentials.delete', {});
      setStatus(
        liveStatus,
        deleteResponse.ok ? 'Credential deleted' : 'Credential was not deleted',
        deleteResponse.ok ? 'success' : 'danger',
      );
      if (!deleteResponse.ok) deleteButton.disabled = false;
    } catch {
      setStatus(liveStatus, 'The credential could not be deleted. Try again.', 'danger');
      deleteButton.disabled = false;
      liveStatus.focus();
    }
  });

  root.append(header, coordinate, liveStatus, form, securityNote);

  let response: ResolverEnvelope<unknown>;
  try {
    response = await invoke('credentials.status', {});
  } catch {
    setStatus(liveStatus, 'Credential status unavailable', 'danger');
    return;
  }
  if (response.ok) {
    const status = response.data as CredentialStatus;
    setStatus(
      liveStatus,
      status.configured
        ? `Credential configured${status.updatedAt ? ` · Updated ${status.updatedAt}` : ''}`
        : 'Credential not configured',
      status.configured ? 'success' : 'warning',
    );
    deleteButton.disabled = !status.configured;
  } else {
    setStatus(liveStatus, 'Credential status unavailable', 'danger');
  }
}
