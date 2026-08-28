const THEME_ID = 'aws-widgets-theme';

const CSS = `
:root {
  color: #17202a;
  background: #f4f7fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
  color-scheme: light;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-width: 280px;
  background:
    linear-gradient(90deg, rgba(35, 47, 62, 0.035) 1px, transparent 1px) 0 0 / 32px 32px,
    #f4f7fa;
}

button, input, select { font: inherit; }

.aws-shell {
  --aws-orange: #ff9900;
  --aws-ink: #17202a;
  --aws-navy: #232f3e;
  --aws-cloud: #f4f7fa;
  --aws-white: #ffffff;
  --aws-line: #d5dce4;
  --aws-muted: #5f6b7a;
  width: min(100%, 860px);
  margin: 0 auto;
  padding: 24px;
}

.surface-header { margin: 0 0 18px; }

.surface-eyebrow,
.coordinate-strip,
.utility,
.observed-at {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.surface-eyebrow {
  margin: 0 0 7px;
  color: #5f6b7a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.surface-title {
  margin: 0;
  color: #17202a;
  font-size: clamp(24px, 4vw, 34px);
  line-height: 1.1;
  letter-spacing: -0.025em;
}

.surface-intro {
  max-width: 650px;
  margin: 10px 0 0;
  color: #5f6b7a;
  font-size: 14px;
  line-height: 1.55;
}

.coordinate-strip {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  margin: 0 0 14px;
  padding: 9px 13px 9px 20px;
  overflow: hidden;
  border: 1px solid #cbd3dc;
  background: #232f3e;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.035em;
}

.coordinate-strip::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 6px;
  background: #ff9900;
  content: "";
}

.coordinate-strip .axis {
  color: #ffb642;
  font-size: 16px;
}

.surface-panel {
  border: 1px solid #d5dce4;
  border-top: 3px solid #232f3e;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(35, 47, 62, 0.07);
}

.surface-panel__body { padding: 20px; }

.status-rail {
  position: relative;
  margin: 0;
  padding: 12px 14px 12px 18px;
  border: 1px solid #d5dce4;
  border-left: 4px solid #6b778c;
  background: #ffffff;
  color: #374151;
  font-size: 13px;
  line-height: 1.45;
  outline: none;
}

.status-rail[data-tone="success"] { border-left-color: #2e7d32; }
.status-rail[data-tone="warning"] { border-left-color: #ff9900; }
.status-rail[data-tone="danger"] { border-left-color: #b42318; }
.status-rail[data-tone="busy"] { border-left-color: #1473e6; }
.status-rail:focus-visible { box-shadow: 0 0 0 3px rgba(20, 115, 230, 0.25); }

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 20px;
}

.field {
  display: grid;
  gap: 7px;
  color: #374151;
  font-size: 13px;
  font-weight: 650;
}

.field--wide { grid-column: 1 / -1; }

.field input,
.field select {
  width: 100%;
  min-height: 42px;
  border: 1px solid #aeb8c4;
  border-radius: 3px;
  background: #ffffff;
  color: #17202a;
  padding: 9px 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  font-weight: 500;
}

.field input:focus,
.field select:focus {
  border-color: #1473e6;
  outline: 3px solid rgba(20, 115, 230, 0.18);
  outline-offset: 1px;
}

.field-hint {
  color: #6b7280;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.45;
}

.surface-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #e2e7ed;
  background: #f8fafc;
}

.surface-actions .status-rail {
  flex: 1 1 100%;
  order: -1;
}

.button {
  min-height: 38px;
  border: 1px solid #17202a;
  border-radius: 3px;
  padding: 8px 15px;
  background: #ffffff;
  color: #17202a;
  font-weight: 700;
  cursor: pointer;
}

.button--primary {
  border-color: #d77e00;
  background: #ff9900;
  color: #17202a;
}

.button--danger { border-color: #b42318; color: #9f1f17; }
.button:hover:not(:disabled) { filter: brightness(0.96); }
.button:focus-visible { outline: 3px solid rgba(20, 115, 230, 0.28); outline-offset: 2px; }
.button:disabled { cursor: not-allowed; opacity: 0.5; }

.security-note {
  margin: 14px 0 0;
  padding: 13px 15px;
  border-left: 3px solid #ff9900;
  background: rgba(255, 153, 0, 0.08);
  color: #4b5563;
  font-size: 12px;
  line-height: 1.55;
}

.resource-panel { padding: 20px; }
.resource-title { margin: 0 0 18px; font-size: 20px; }

.resource-fields {
  display: grid;
  grid-template-columns: minmax(120px, 0.45fr) minmax(0, 1fr);
  margin: 0;
  border-top: 1px solid #d5dce4;
}

.resource-fields dt,
.resource-fields dd {
  min-width: 0;
  margin: 0;
  padding: 11px 4px;
  border-bottom: 1px solid #e3e8ee;
}

.resource-fields dt { color: #5f6b7a; font-size: 12px; font-weight: 700; }
.resource-fields dd { overflow-wrap: anywhere; color: #17202a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; }
.resource-fields ul { margin: 0; padding-left: 18px; }
.observed-at { margin: 15px 0 0; color: #6b7280; font-size: 11px; }

@media (max-width: 560px) {
  .aws-shell { padding: 14px; }
  .field-grid { grid-template-columns: 1fr; padding: 16px; }
  .field--wide { grid-column: auto; }
  .resource-fields { grid-template-columns: 1fr; }
  .resource-fields dt { border-bottom: 0; padding-bottom: 2px; }
  .resource-fields dd { padding-top: 2px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
}
`;

export const installTheme = (): void => {
  if (document.getElementById(THEME_ID)) return;
  const style = document.createElement('style');
  style.id = THEME_ID;
  style.textContent = CSS;
  document.head.append(style);
};

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
