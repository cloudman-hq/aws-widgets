import {
  RESOURCE_TYPES,
  SUPPORTED_REGIONS,
  type MacroConfigV1,
  type PublicErrorCode,
  type ResolverEnvelope,
  type ResolverOperation,
  type ResourceType,
  type ResourceView,
} from '../shared/contracts.js';
import { installTheme, setCoordinate, setStatus } from './theme.js';

type Invoke = (
  operation: ResolverOperation,
  payload: Record<string, unknown>,
) => Promise<ResolverEnvelope<unknown>>;

export type MacroViewDependencies = {
  invoke: Invoke;
  getContext: () => Promise<unknown>;
};

const TYPE_LABELS: Record<ResourceType, string> = {
  ec2: 'EC2',
  s3: 'S3',
  lambda: 'Lambda',
  ecs: 'ECS',
  dynamodb: 'DynamoDB',
};

const ERROR_MESSAGES: Record<PublicErrorCode, string> = {
  INVALID_INPUT: 'The resource configuration is invalid. Edit the macro and check each field.',
  UNAUTHORIZED: 'You do not have access to load this AWS resource.',
  NOT_CONFIGURED: 'The AWS credential is not configured. Ask a Confluence administrator to open AWS Widgets settings.',
  INVALID_AUTH: 'The AWS credential is invalid or expired. Ask a Confluence administrator to replace it.',
  PERMISSION_DENIED: 'AWS denied access to this resource. Check the credential’s read permissions.',
  NOT_FOUND: 'The AWS resource was not found in this region.',
  THROTTLED: 'AWS is limiting requests. Try again in a moment.',
  NETWORK_ERROR: 'AWS could not be reached. Check the connection and try again.',
  RESULT_LIMIT: 'There are too many resources to list safely. Edit the macro and enter an identifier.',
  INTERNAL_ERROR: 'The AWS resource could not be loaded. Try again.',
};

const readConfig = (context: unknown): MacroConfigV1 | undefined => {
  if (typeof context !== 'object' || context === null) return undefined;
  const extension = Reflect.get(context, 'extension');
  if (typeof extension !== 'object' || extension === null) return undefined;
  const config = Reflect.get(extension, 'config');
  if (typeof config !== 'object' || config === null) return undefined;
  const schemaVersion = Reflect.get(config, 'schemaVersion');
  const region = Reflect.get(config, 'region');
  const resourceType = Reflect.get(config, 'resourceType');
  const resourceId = Reflect.get(config, 'resourceId');
  if (
    schemaVersion !== 1 ||
    typeof region !== 'string' ||
    !SUPPORTED_REGIONS.includes(region as (typeof SUPPORTED_REGIONS)[number]) ||
    typeof resourceType !== 'string' ||
    !RESOURCE_TYPES.includes(resourceType as ResourceType) ||
    typeof resourceId !== 'string' ||
    resourceId.trim().length === 0
  ) return undefined;
  return {
    schemaVersion: 1,
    region: region as MacroConfigV1['region'],
    resourceType: resourceType as ResourceType,
    resourceId: resourceId.trim(),
  };
};

const renderResource = (container: HTMLElement, view: ResourceView): void => {
  container.replaceChildren();
  container.className = 'surface-panel resource-panel';
  const title = document.createElement('h2');
  title.className = 'resource-title';
  title.textContent = view.title;
  const fields = document.createElement('dl');
  fields.className = 'resource-fields';
  for (const field of view.fields) {
    const term = document.createElement('dt');
    term.textContent = field.label;
    const value = document.createElement('dd');
    if (Array.isArray(field.value)) {
      const list = document.createElement('ul');
      for (const item of field.value) {
        const entry = document.createElement('li');
        entry.textContent = item;
        list.append(entry);
      }
      value.append(list);
    } else {
      value.textContent = field.value;
    }
    fields.append(term, value);
  }
  const observed = document.createElement('p');
  observed.className = 'observed-at';
  observed.textContent = 'Observed ';
  const observedTime = document.createElement('time');
  observedTime.dateTime = view.observedAt;
  observedTime.textContent = view.observedAt;
  observed.append(observedTime);
  container.append(title, fields, observed);
};

export async function mountMacroView(
  root: HTMLElement,
  dependencies: MacroViewDependencies,
): Promise<void> {
  installTheme();
  root.replaceChildren();
  root.className = 'aws-shell aws-shell--view';
  const header = document.createElement('header');
  header.className = 'surface-header';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'surface-eyebrow';
  eyebrow.textContent = 'Live resource';
  const heading = document.createElement('h1');
  heading.className = 'surface-title';
  heading.textContent = 'AWS resource';
  header.append(eyebrow, heading);
  const liveStatus = document.createElement('p');
  liveStatus.className = 'status-rail';
  liveStatus.setAttribute('aria-live', 'polite');
  setStatus(liveStatus, 'Loading AWS resource…', 'busy');
  root.append(header, liveStatus);
  void dependencies.invoke('analytics.track', { event: 'macro_view_attempt' }).catch(() => undefined);

  const config = readConfig(await dependencies.getContext());
  if (!config) {
    setStatus(
      liveStatus,
      'Configure this macro to choose an AWS resource.',
      'warning',
    );
    return;
  }

  const coordinate = document.createElement('p');
  coordinate.className = 'coordinate-strip';
  coordinate.dataset.coordinateStrip = '';
  setCoordinate(coordinate, config.region, TYPE_LABELS[config.resourceType]);
  const content = document.createElement('section');
  const actions = document.createElement('div');
  actions.className = 'surface-actions';
  root.replaceChildren(header, coordinate, liveStatus, content, actions);

  const load = async (): Promise<void> => {
    actions.replaceChildren();
    content.replaceChildren();
    setStatus(liveStatus, 'Loading AWS resource…', 'busy');
    let response: ResolverEnvelope<unknown>;
    try {
      response = await dependencies.invoke('resource.describe', config);
    } catch {
      setStatus(liveStatus, ERROR_MESSAGES.INTERNAL_ERROR, 'danger');
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Try again';
      retry.className = 'button';
      retry.addEventListener('click', () => void load());
      actions.append(retry);
      return;
    }
    if (!response.ok) {
      setStatus(liveStatus, ERROR_MESSAGES[response.error.code], 'danger');
      if (response.error.retryable) {
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = 'Try again';
        retry.className = 'button';
        retry.addEventListener('click', () => void load());
        actions.append(retry);
      }
      return;
    }
    setStatus(liveStatus, 'Resource loaded', 'success');
    renderResource(content, response.data as ResourceView);
  };

  await load();
}
