import {
  RESOURCE_TYPES,
  SUPPORTED_REGIONS,
  type MacroConfigV1,
  type ResolverEnvelope,
  type ResolverOperation,
  type ResourceType,
  type SupportedRegion,
} from '../shared/contracts.js';
import { installTheme, setCoordinate, setStatus } from './theme.js';

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
  const current = existingConfig(await dependencies.getContext());
  installTheme();
  root.replaceChildren();
  root.className = 'aws-shell aws-shell--config';

  const header = document.createElement('header');
  header.className = 'surface-header';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'surface-eyebrow';
  eyebrow.textContent = 'Macro configuration';
  const heading = document.createElement('h1');
  heading.className = 'surface-title';
  heading.textContent = 'Configure resource';
  const intro = document.createElement('p');
  intro.className = 'surface-intro';
  intro.textContent = 'Choose one read-only AWS resource for this macro. The identifier is saved with the page; the installation credential is not.';
  header.append(eyebrow, heading, intro);
  const coordinate = document.createElement('p');
  coordinate.className = 'coordinate-strip';
  coordinate.dataset.coordinateStrip = '';

  const form = document.createElement('form');
  form.className = 'surface-panel';
  const fieldGrid = document.createElement('div');
  fieldGrid.className = 'field-grid';
  const regionLabel = document.createElement('label');
  regionLabel.className = 'field';
  regionLabel.htmlFor = 'region';
  regionLabel.textContent = 'AWS region';
  const region = document.createElement('select');
  region.id = 'region';
  region.name = 'region';
  region.required = true;
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
  typeLabel.htmlFor = 'resource-type';
  typeLabel.textContent = 'Resource type';
  const resourceType = document.createElement('select');
  resourceType.id = 'resource-type';
  resourceType.name = 'resourceType';
  resourceType.required = true;
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
  idLabel.htmlFor = 'resource-id';
  idLabel.textContent = 'Resource identifier';
  const resourceId = document.createElement('input');
  resourceId.id = 'resource-id';
  resourceId.name = 'resourceId';
  resourceId.required = true;
  resourceId.maxLength = 512;
  resourceId.autocomplete = 'off';
  resourceId.setAttribute('aria-describedby', 'resource-id-hint');
  resourceId.value = current.resourceId ?? '';
  resourceId.setAttribute('list', 'resource-options');
  idLabel.append(resourceId);
  const resourceOptions = document.createElement('datalist');
  resourceOptions.id = 'resource-options';
  const idHint = document.createElement('span');
  idHint.id = 'resource-id-hint';
  idHint.className = 'field-hint';
  idHint.textContent = 'Choose a loaded option or enter an exact AWS identifier.';
  idLabel.append(idHint);

  const liveStatus = document.createElement('p');
  liveStatus.className = 'status-rail';
  liveStatus.setAttribute('aria-live', 'polite');
  liveStatus.tabIndex = -1;

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Save resource';
  submitButton.className = 'button button--primary';

  const updateCoordinate = (): void => {
    const selectedType = RESOURCE_TYPES.includes(resourceType.value as ResourceType)
      ? TYPE_LABELS[resourceType.value as ResourceType]
      : 'TYPE';
    setCoordinate(coordinate, region.value || 'REGION', selectedType);
  };
  let listRequest = 0;
  const loadOptions = async (): Promise<void> => {
    updateCoordinate();
    resourceOptions.replaceChildren();
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
    const request = ++listRequest;
    setStatus(liveStatus, 'Loading resource choices…', 'busy');
    let response: ResolverEnvelope<unknown>;
    try {
      response = await dependencies.invoke('resource.list', {
        region: region.value,
        resourceType: resourceType.value,
      });
    } catch {
      if (request === listRequest) {
        setStatus(liveStatus, 'Resource choices unavailable. Enter an identifier manually.', 'warning');
      }
      return;
    }
    if (request !== listRequest) return;
    if (!response.ok) {
      setStatus(liveStatus, 'Resource choices unavailable. Enter an identifier manually.', 'warning');
      return;
    }

    const data = response.data;
    const items = typeof data === 'object' && data !== null && Array.isArray(Reflect.get(data, 'items'))
      ? Reflect.get(data, 'items') as Array<unknown>
      : [];
    for (const item of items) {
      if (typeof item !== 'object' || item === null) continue;
      const id = Reflect.get(item, 'id');
      const label = Reflect.get(item, 'label');
      if (typeof id !== 'string' || typeof label !== 'string') continue;
      const choice = option(id, label);
      resourceOptions.append(choice);
    }
    setStatus(
      liveStatus,
      items.length > 0
        ? 'Resource choices loaded. You can also enter an identifier manually.'
        : 'No resource choices found. Enter an identifier manually.',
      items.length > 0 ? 'success' : 'warning',
    );
  };
  region.addEventListener('change', () => void loadOptions());
  resourceType.addEventListener('change', () => void loadOptions());
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
      setStatus(liveStatus, 'Resource saved', 'success');
    } catch {
      setStatus(liveStatus, 'Resource was not saved. Check the fields and try again.', 'danger');
      liveStatus.focus();
      submitButton.disabled = false;
    }
  });

  const actions = document.createElement('div');
  actions.className = 'surface-actions';
  actions.append(liveStatus, submitButton);
  fieldGrid.append(regionLabel, typeLabel, idLabel, resourceOptions);
  form.append(fieldGrid, actions);
  root.append(header, coordinate, form);
  await loadOptions();
}
