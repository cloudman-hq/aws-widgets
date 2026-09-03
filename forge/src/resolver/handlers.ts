import type { Request } from '@forge/resolver';
import type { CredentialRepository } from './credentials/repository';
import { createCredentialOperations } from './credentials/operations';
import { authorizeModule, MACRO_MODULE_KEY, SETTINGS_MODULE_KEY } from './authorization';
import type { CredentialInput } from './schemas';
import { toSafeEnvelope, type SafeLogEvent } from './safety';
import { createResourceOperations } from './resources/operations';
import type { ResourceAdapterFactory } from './resources/types';
import { PublicResolverError } from './errors';
import { ANALYTICS_EVENTS, type AnalyticsEvent, type AnalyticsTracker } from './analytics';

type ResolverDependencies = {
  repository: CredentialRepository;
  validateWithAws: (credential: CredentialInput) => Promise<void>;
  now: () => Date;
  createRequestId: () => string;
  log: (event: SafeLogEvent) => void;
  createResourceAdapter?: ResourceAdapterFactory;
  analytics?: AnalyticsTracker;
};

const analyticsEvent = (payload: unknown): AnalyticsEvent => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new PublicResolverError('INVALID_INPUT');
  const event = Reflect.get(payload, 'event');
  if (typeof event !== 'string' || !ANALYTICS_EVENTS.includes(event as AnalyticsEvent)) {
    throw new PublicResolverError('INVALID_INPUT');
  }
  return event as AnalyticsEvent;
};

export const createResolverHandlers = (dependencies: ResolverDependencies) => {
  const operations = createCredentialOperations(dependencies);
  const resourceOperations = createResourceOperations({
    repository: dependencies.repository,
    createAdapter: dependencies.createResourceAdapter ?? (() => {
      throw new PublicResolverError('INTERNAL_ERROR', true);
    }),
  });
  const track = (event: AnalyticsEvent, outcome: 'attempt' | 'success' | 'failure', errorCode?: import('../shared/contracts').PublicErrorCode) => {
    void dependencies.analytics?.track(event, outcome, errorCode).catch(() => undefined);
  };
  const credentialHandler =
    <T>(
      operation: 'credentials.status' | 'credentials.save' | 'credentials.delete',
      execute: (payload: unknown) => Promise<T>,
    ) =>
    ({ payload, context }: Request<unknown>) => {
      const requestId = dependencies.createRequestId();
      return toSafeEnvelope(
        requestId,
        operation,
        async () => {
          authorizeModule(context, SETTINGS_MODULE_KEY);
          return execute(payload);
        },
        dependencies.log,
      );
    };

  const resourceHandler =
    <T>(
      operation: 'resource.describe',
      execute: (payload: unknown) => Promise<T>,
    ) =>
    async ({ payload, context }: Request<unknown>) => {
      const requestId = dependencies.createRequestId();
      const result = await toSafeEnvelope(
        requestId,
        operation,
        async () => {
          authorizeModule(context, MACRO_MODULE_KEY);
          return execute(payload);
        },
        dependencies.log,
      );
      track('aws_describe', result.ok ? 'success' : 'failure', result.ok ? undefined : result.error.code);
      return result;
    };

  return {
    'analytics.track': async ({ payload, context }: Request<unknown>) => {
      const requestId = dependencies.createRequestId();
      const result = await toSafeEnvelope(
        requestId,
        'analytics.track',
        async () => {
          authorizeModule(context, MACRO_MODULE_KEY);
          const event = analyticsEvent(payload);
          track(event, 'attempt');
          return { tracked: true };
        },
        dependencies.log,
      );
      return result;
    },
    'credentials.status': credentialHandler('credentials.status', operations.status),
    'credentials.save': credentialHandler('credentials.save', operations.save),
    'credentials.delete': credentialHandler('credentials.delete', operations.delete),
    'resource.describe': resourceHandler('resource.describe', resourceOperations.describe),
  };
};
