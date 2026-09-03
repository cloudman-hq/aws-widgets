import { describe, expect, it, vi } from 'vitest';
import { createMixpanelTracker } from '../src/resolver/analytics.js';

describe('Mixpanel usage telemetry', () => {
  it('sends only the anonymous installation event and a public failure category', async () => {
    const send = vi.fn(async () => new Response('{}', { status: 200 }));
    const tracker = createMixpanelTracker('test-token', async () => '0b055caf-21fd-4fd0-ae3c-9d302855bf63', send);

    await tracker.track('aws_describe', 'failure', 'NOT_FOUND');

    const [, options] = send.mock.calls[0]! as unknown as [string, RequestInit];
    const event = JSON.parse(String(options.body))[0];
    expect(event).toEqual({
      event: 'aws_widgets_aws_describe',
      properties: {
        token: 'test-token',
        distinct_id: '0b055caf-21fd-4fd0-ae3c-9d302855bf63',
        outcome: 'failure',
        error_code: 'NOT_FOUND',
      },
    });
    expect(JSON.stringify(event)).not.toContain('resourceId');
    expect(JSON.stringify(event)).not.toContain('accessKey');
  });

  it('does nothing when no deployment token is configured', async () => {
    const send = vi.fn();
    await createMixpanelTracker('', async () => 'unused', send).track('macro_view_attempt', 'attempt');
    expect(send).not.toHaveBeenCalled();
  });
});
