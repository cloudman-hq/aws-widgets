import {
  RESOURCE_TYPES,
  SUPPORTED_REGIONS,
  type MacroConfigV1,
  type ResolverEnvelope,
  type ResolverOperation,
  type ResourceType,
  type SupportedRegion,
} from '../shared/contracts.js';
import { setCoordinate, setStatus } from './theme.js';

type Invoke = (
  operation: ResolverOperation,
  payload: Record<string, unknown>,
) => Promise<ResolverEnvelope<unknown>>;

export type MacroConfigDependencies = {
  invoke: Invoke;
  getContext: () => Promise<unknown>;
  submit: (payload: { config: MacroConfigV1 }) => Promise<void>;
};

const TYPE_LABELS: Record<ResourceType, string> = {
  ec2: 'EC2',
  s3: 'S3',
  lambda: 'Lambda',
  ecs: 'ECS',
  dynamodb: 'DynamoDB',
};

const option = (value: string, label: string): HTMLOptionElement => {
  const element = document.createElement('option');
  element.value = value;
  element.textContent = label;
  return element;
};

const existingConfig = (context: unknown): Partial<MacroConfigV1> => {
  if (typeof context !== 'object' || context === null) return {};
  const extension = Reflect.get(context, 'extension');
  if (typeof extension !== 'object' || extension === null) return {};
  const config = Reflect.get(extension, 'config');
  return typeof config === 'object' && config !== null
    ? config as Partial<MacroConfigV1>
    : {};
};

export async function mountMacroConfig(
  root: HTMLElement,
  dependencies: MacroConfigDependencies,
): Promise<void> {
  const context = await dependencies.getContext();
  const current = existingConfig(context);
  void dependencies.invoke('analytics.track', { event: 'macro_config_opened' }).catch(() => undefined);
  root.replaceChildren();
  root.className = 'aws-shell aws-shell--config';
  root.style.cssText = [
    'box-sizing:border-box',
    'width:100%',
    'max-width:680px',
    'margin:0 auto',
    'overflow:hidden',
    'border:1px solid #c7ced7',
    'border-radius:8px',
    'background:#fff',
    'color:#17202a',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
  ].join(';');

  const header = document.createElement('header');
  header.className = 'surface-header';
  header.style.cssText = 'margin:0;padding:21px 24px 19px;background:#2bcf96;color:#112438';
  const heading = document.createElement('h1');
  heading.className = 'surface-title';
  heading.textContent = 'AWS resource';
  heading.style.cssText = 'margin:0;color:#112438;font-size:26px;font-weight:760;line-height:1.1;letter-spacing:-.03em';
  const intro = document.createElement('p');
  intro.className = 'surface-intro';
  intro.textContent = 'Choose the live resource this macro should display.';
  intro.style.cssText = 'margin:5px 0 0;color:rgba(17,36,56,.8);font-size:13px;line-height:1.5';
  header.append(heading, intro);
  const coordinate = document.createElement('p');
  coordinate.className = 'coordinate-strip';
  coordinate.dataset.coordinateStrip = '';
  coordinate.style.cssText = [
    'display:flex', 'align-items:center', 'gap:10px', 'min-height:36px',
    'margin:0', 'padding:8px 24px', 'border:0', 'border-bottom:1px solid #c7ced7',
    'background:#f4f6f8', 'color:#34495e',
    'font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
    'font-size:12px', 'font-weight:700',
  ].join(';');

  const form = document.createElement('form');
  form.className = 'surface-panel';
  form.style.cssText = 'margin:0;border:0;background:#fff';
  const fieldGrid = document.createElement('div');
  fieldGrid.className = 'field-grid';
  fieldGrid.style.cssText = 'display:block;padding:0';
  const rowStyle = [
    'display:grid', 'grid-template-columns:minmax(138px,.42fr) minmax(0,1fr)',
    'align-items:center', 'gap:16px', 'min-height:62px', 'margin:0', 'padding:10px 24px',
    'border-bottom:1px solid #c7ced7', 'color:#17202a',
    'font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
    'font-size:14px', 'font-weight:500',
  ].join(';');
  const fieldStyle = [
    'width:100%', 'min-width:0', 'min-height:38px', 'border:0', 'border-radius:0',
    'background:transparent', 'color:#e87500', 'padding:6px 0',
    'font:500 16px ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
  ].join(';');
  const regionLabel = document.createElement('label');
  regionLabel.className = 'field';
  regionLabel.style.cssText = rowStyle;
  regionLabel.htmlFor = 'region';
  regionLabel.textContent = 'Region';
  const region = document.createElement('select');
  region.id = 'region';
  region.name = 'region';
  region.required = true;
  region.style.cssText = fieldStyle;
  const blankRegion = option('', 'Choose a region');
  blankRegion.disabled = true;
  region.append(blankRegion);
  for (const value of SUPPORTED_REGIONS) region.append(option(value, value));
  region.value = current.region && SUPPORTED_REGIONS.includes(current.region)
    ? current.region
    : '';
  regionLabel.append(region);

  const typeLabel = document.createElement('label');
  typeLabel.className = 'field';
  typeLabel.style.cssText = rowStyle;
  typeLabel.htmlFor = 'resource-type';
  typeLabel.textContent = 'Service';
  const resourceType = document.createElement('select');
  resourceType.id = 'resource-type';
  resourceType.name = 'resourceType';
  resourceType.required = true;
  resourceType.style.cssText = fieldStyle;
  const blankType = option('', 'Choose a resource type');
  blankType.disabled = true;
  resourceType.append(blankType);
  for (const value of RESOURCE_TYPES) resourceType.append(option(value, TYPE_LABELS[value]));
  if (current.resourceType && RESOURCE_TYPES.includes(current.resourceType)) {
    resourceType.value = current.resourceType;
  } else {
    resourceType.value = '';
  }
  typeLabel.append(resourceType);

  const idLabel = document.createElement('label');
  idLabel.className = 'field field--wide';
  idLabel.style.cssText = `${rowStyle};padding-bottom:7px`;
  idLabel.htmlFor = 'resource-id';
  idLabel.textContent = 'Resource ID or name';
  const resourceId = document.createElement('input');
  resourceId.id = 'resource-id';
  resourceId.name = 'resourceId';
  resourceId.required = true;
  resourceId.maxLength = 512;
  resourceId.autocomplete = 'off';
  resourceId.style.cssText = fieldStyle;
  resourceId.setAttribute('aria-describedby', 'resource-id-hint');
  resourceId.value = current.resourceId ?? '';
  idLabel.append(resourceId);
  const idHint = document.createElement('span');
  idHint.id = 'resource-id-hint';
  idHint.className = 'field-hint';
  idHint.textContent = 'Enter the exact AWS resource identifier.';
  idHint.style.cssText = 'grid-column:2;margin-top:-11px;color:#687787;font:12px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  idLabel.append(idHint);

  const liveStatus = document.createElement('p');
  liveStatus.className = 'status-rail';
  liveStatus.setAttribute('aria-live', 'polite');
  liveStatus.tabIndex = -1;
  liveStatus.style.cssText = 'flex:1 1 auto;margin:0;padding:8px 0;border:0;background:transparent;color:#687787;font-size:13px;line-height:1.45';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Save resource';
  submitButton.className = 'button button--primary';
  submitButton.style.cssText = 'min-height:38px;border:1px solid #168d67;border-radius:5px;padding:8px 15px;background:#168d67;color:#fff;font-size:14px;font-weight:700;cursor:pointer';

  const updateCoordinate = (): void => {
    const selectedType = RESOURCE_TYPES.includes(resourceType.value as ResourceType)
      ? TYPE_LABELS[resourceType.value as ResourceType]
      : 'TYPE';
    setCoordinate(coordinate, region.value || 'REGION', selectedType);
  };
  const updateHint = (): void => {
    updateCoordinate();
    if (!region.value || !resourceType.value) {
      setStatus(liveStatus, 'Choose a region and resource type.', 'neutral');
      return;
    }
    if (resourceType.value === 's3') {
      resourceId.placeholder = 'my-bucket or arn:aws:s3:::my-bucket';
      setStatus(liveStatus, 'Enter an S3 bucket name or ARN.', 'neutral');
      return;
    }

    resourceId.placeholder = 'Exact name, ID, or ARN';
    setStatus(
      liveStatus,
      `${TYPE_LABELS[resourceType.value as ResourceType]} in ${region.value}`,
      'neutral',
    );
  };
  region.addEventListener('change', updateHint);
  resourceType.addEventListener('change', updateHint);
  updateCoordinate();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submitButton.disabled = true;
    setStatus(liveStatus, 'Saving resource…', 'busy');
    const config: MacroConfigV1 = {
      schemaVersion: 1,
      region: region.value as SupportedRegion,
      resourceType: resourceType.value as ResourceType,
      resourceId: resourceId.value.trim(),
    };
    try {
      await dependencies.submit({ config });
      void dependencies.invoke('analytics.track', { event: 'macro_config_saved' }).catch(() => undefined);
      setStatus(liveStatus, 'Resource saved', 'success');
    } catch {
      setStatus(liveStatus, 'Resource was not saved. Check the fields and try again.', 'danger');
      liveStatus.focus();
      submitButton.disabled = false;
    }
  });

  const actions = document.createElement('div');
  actions.className = 'surface-actions';
  actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding:16px 24px;background:#fff';
  actions.append(liveStatus, submitButton);
  fieldGrid.append(regionLabel, typeLabel, idLabel);
  form.append(fieldGrid, actions);
  root.append(header, coordinate, form);
  updateHint();
}
