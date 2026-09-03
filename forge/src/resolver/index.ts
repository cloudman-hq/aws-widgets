import Resolver from '@forge/resolver';
import { randomUUID } from 'node:crypto';
import { validateCredentialWithAws } from './aws/credential-validator';
import { createAwsResourceAdapter } from './aws/factory';
import { forgeCredentialRepository } from './credentials/forge-repository';
import { createResolverHandlers } from './handlers';
import type { SafeLogEvent } from './safety';
import { createMixpanelTracker } from './analytics';

const resolver = new Resolver();

const handlers = createResolverHandlers({
  repository: forgeCredentialRepository,
  validateWithAws: validateCredentialWithAws,
  now: () => new Date(),
  createRequestId: randomUUID,
  log: (event: SafeLogEvent) => console.info(JSON.stringify(event)),
  createResourceAdapter: createAwsResourceAdapter,
  analytics: createMixpanelTracker(),
});

for (const [operation, handler] of Object.entries(handlers)) {
  resolver.define(operation, handler);
}

export const handler = resolver.getDefinitions();
