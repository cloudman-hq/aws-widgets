import type { ResolverOperation } from '../shared/contracts.js';

type Invoke = (operation: ResolverOperation, payload: unknown) => Promise<unknown>;

export function wireSurface(
  root: HTMLElement,
  name: string,
  invoke: Invoke,
): void {
  root.replaceChildren();
  const heading = document.createElement('h1');
  heading.textContent = name;
  const status = document.createElement('p');
  status.textContent = 'Forge bridge ready. Feature implementation follows in later stages.';
  root.append(heading, status);

  // Retain the typed bridge at this boundary without making a request during
  // bootstrap. Later UI stages replace this no-op wiring with surface flows.
  void invoke;
}
