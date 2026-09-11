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
import { setCoordinate, setStatus } from './theme.js';

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

const SERVICE_COLORS: Record<ResourceType, string> = {
  ec2: '#ec7211',
  s3: '#7aa116',
  lambda: '#ff9900',
  ecs: '#5b65c8',
  dynamodb: '#4053d6',
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

const formatObservedAt = (observedAt: string): string => {
  const observed = Date.parse(observedAt);
  if (Number.isNaN(observed)) return 'Observed recently';
  return `Observed ${new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(observed))}`;
};

const renderResource = (
  container: HTMLElement,
  view: ResourceView,
  config: MacroConfigV1,
  onRefresh: () => void,
): void => {
  container.replaceChildren();
  container.className = 'surface-panel resource-panel';
  // Forge's host stylesheet can be unavailable while an iframe is loading.  These
  // structural styles deliberately live on the elements so the resource remains a
  // legible console-style card during that window as well.
  container.style.cssText = [
    'box-sizing:border-box',
    'width:100%',
    'max-width:100%',
    'min-width:0',
    'overflow:hidden',
    'overflow-x:hidden',
    'border:1px solid #c5ced8',
    'border-radius:8px',
    'background:#fff',
    'box-shadow:0 2px 8px rgba(9,30,66,.12)',
  ].join(';');
  const meta = document.createElement('div');
  meta.className = 'resource-meta';
  meta.style.cssText = [
    'display:flex',
    'align-items:center',
    'justify-content:space-between',
    'gap:12px',
    'flex-wrap:wrap',
    'min-height:78px',
    'padding:18px 20px',
    `background:${SERVICE_COLORS[view.resourceType]}`,
    'color:#fff',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
  ].join(';');
  const service = document.createElement('span');
  service.style.cssText = 'display:flex;align-items:center;gap:9px;min-width:0;max-width:100%';
  const serviceIcon = document.createElement('span');
  serviceIcon.setAttribute('aria-hidden', 'true');
  serviceIcon.textContent = '';
  serviceIcon.style.cssText = 'display:none';
  const type = document.createElement('span');
  type.className = 'resource-type';
  type.textContent = TYPE_LABELS[view.resourceType];
  type.style.cssText = 'min-width:0;overflow-wrap:anywhere;font-size:28px;font-weight:700;letter-spacing:-.02em';
  service.append(serviceIcon, type);
  meta.append(service);
  const status = view.fields.find((field) => /(?:status|state)$/i.test(field.key));
  if (status && !Array.isArray(status.value)) {
    const badge = document.createElement('span');
    badge.className = 'resource-status';
    badge.textContent = status.value;
    badge.style.cssText = 'display:grid;place-items:center;min-width:48px;min-height:48px;max-width:100%;overflow-wrap:anywhere;padding:6px;border-radius:50%;background:#ffda45;color:#5f4a00;font-size:12px;font-weight:750;letter-spacing:.02em';
    meta.append(badge);
  }
  const body = document.createElement('div');
  body.style.cssText = 'box-sizing:border-box;min-width:0;max-width:100%;padding:0;overflow-x:hidden;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace';
  const title = document.createElement('h2');
  title.className = 'resource-title';
  title.textContent = view.title;
  title.style.cssText = 'display:none';
  const context = document.createElement('p');
  context.textContent = config.region;
  context.style.cssText = 'display:none';
  const fields = document.createElement('dl');
  fields.className = 'resource-fields';
  fields.style.cssText = 'box-sizing:border-box;display:grid;grid-template-columns:minmax(0, .4fr) minmax(0, .6fr);width:100%;max-width:100%;margin:0;border:0;overflow:hidden;overflow-x:hidden';
  for (const field of view.fields) {
    const term = document.createElement('dt');
    term.textContent = field.label;
    term.style.cssText = 'margin:0;padding:18px 20px;background:#fff;border-bottom:1px solid #c9c9c9;color:#17202a;font-size:16px;font-weight:500;line-height:1.35';
    const value = document.createElement('dd');
    value.style.cssText = `box-sizing:border-box;min-width:0;max-width:100%;margin:0;padding:18px 20px;border-bottom:1px solid #c9c9c9;color:${SERVICE_COLORS[view.resourceType]};font-size:16px;font-weight:500;line-height:1.35;overflow-wrap:anywhere;word-break:break-word`;
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
  const footer = document.createElement('div');
  footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;min-width:0;padding:14px 20px';
  const observed = document.createElement('p');
  observed.className = 'observed-at';
  observed.textContent = formatObservedAt(view.observedAt);
  observed.style.cssText = 'min-width:0;margin:0;overflow-wrap:anywhere;color:#6b778c;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;line-height:1.35';
  const observedTime = document.createElement('time');
  observedTime.dateTime = view.observedAt;
  observedTime.title = view.observedAt;
  observed.append(observedTime);
  const refresh = document.createElement('button');
  refresh.type = 'button';
  refresh.textContent = 'Refresh';
  refresh.style.cssText = 'border:1px solid #b8c4d2;border-radius:4px;padding:7px 11px;background:#fff;color:#295ea8;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer';
  refresh.addEventListener('click', onRefresh);
  footer.append(observed, refresh);
  body.append(title, context, fields, footer);
  container.append(meta, body);
};

export async function mountMacroView(
  root: HTMLElement,
  dependencies: MacroViewDependencies,
): Promise<void> {
  root.replaceChildren();
  root.className = 'aws-shell aws-shell--view';
  root.style.cssText = 'box-sizing:border-box;width:100%;max-width:920px;min-width:0;margin:0 auto;padding:16px;overflow:hidden;overflow-x:hidden;background:#fff;color:#172b4d;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  const liveStatus = document.createElement('p');
  liveStatus.className = 'status-rail';
  liveStatus.style.cssText = 'margin:14px 0;padding:9px 12px;border:1px solid #b7dfc1;border-left:4px solid #2e7d32;border-radius:4px;background:#f1faf3;color:#245b33;font-size:13px;font-weight:600;line-height:1.35';
  liveStatus.setAttribute('aria-live', 'polite');
  setStatus(liveStatus, 'Loading AWS resource…', 'busy');
  root.append(liveStatus);
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
  coordinate.style.cssText = 'display:none';
  coordinate.dataset.coordinateStrip = '';
  setCoordinate(coordinate, config.region, TYPE_LABELS[config.resourceType]);
  const content = document.createElement('section');
  content.style.cssText = 'box-sizing:border-box;width:100%;max-width:100%;min-width:0;margin:0 auto;overflow-x:hidden';
  const actions = document.createElement('div');
  actions.className = 'surface-actions';
  root.replaceChildren(coordinate, liveStatus, content, actions);

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
    coordinate.style.display = 'none';
    liveStatus.style.display = 'none';
    renderResource(content, response.data as ResourceView, config, () => void load());
  };

  await load();
}
