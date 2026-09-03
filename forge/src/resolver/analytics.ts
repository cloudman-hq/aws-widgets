import { randomUUID } from 'node:crypto';
import { kvs } from '@forge/kvs';
import type { PublicErrorCode } from '../shared/contracts';

const INSTALLATION_ID_KEY = 'aws.analytics.installation-id.v1';
const MIXPANEL_URL = 'https://api.mixpanel.com/import?strict=1';

export const ANALYTICS_EVENTS = [
  'macro_view_attempt',
  'macro_config_opened',
  'macro_config_saved',
  'aws_describe',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];
export type AnalyticsOutcome = 'attempt' | 'success' | 'failure';

export type AnalyticsTracker = {
  track(event: AnalyticsEvent, outcome: AnalyticsOutcome, errorCode?: PublicErrorCode): Promise<void>;
};

const installationId = async (): Promise<string> => {
  const stored = await kvs.getSecret(INSTALLATION_ID_KEY);
  if (typeof stored === 'string' && /^[0-9a-f-]{36}$/i.test(stored)) return stored;
  const created = randomUUID();
  await kvs.setSecret(INSTALLATION_ID_KEY, created);
  return created;
};

export const createMixpanelTracker = (
  token = process.env.MIXPANEL_TOKEN,
  getInstallationId = installationId,
  send: typeof fetch = fetch,
): AnalyticsTracker => ({
  track: async (event, outcome, errorCode) => {
    if (!token) return;
    const distinctId = await getInstallationId();
    const properties: Record<string, string> = {
      token,
      distinct_id: distinctId,
      outcome,
    };
    if (outcome === 'failure' && errorCode) properties.error_code = errorCode;
    const response = await send(MIXPANEL_URL, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${token}:`)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ event: `aws_widgets_${event}`, properties }]),
    });
    if (!response.ok) throw new Error('Analytics delivery failed');
  },
});
