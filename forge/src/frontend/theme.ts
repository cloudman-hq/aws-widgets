export const setStatus = (
  element: HTMLElement,
  text: string,
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'busy' = 'neutral',
): void => {
  element.textContent = text;
  element.dataset.tone = tone;
};

export const setCoordinate = (
  element: HTMLElement,
  left: string,
  right: string,
): void => {
  const leftAxis = document.createElement('span');
  leftAxis.textContent = left;
  const separator = document.createElement('span');
  separator.className = 'axis';
  separator.setAttribute('aria-hidden', 'true');
  separator.textContent = ' × ';
  const rightAxis = document.createElement('span');
  rightAxis.textContent = right;
  element.replaceChildren(leftAxis, separator, rightAxis);
};
