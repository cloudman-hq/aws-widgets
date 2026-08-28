import Resolver from '@forge/resolver';
import { randomUUID } from 'node:crypto';
import { validateCredentialWithAws } from './aws/credential-validator.js';
import { createAwsResourceAdapter } from './aws/factory.js';
import { forgeCredentialRepository } from './credentials/forge-repository.js';
import { createResolverHandlers } from './handlers.js';
import type { SafeLogEvent } from './safety.js';

const resolver = new Resolver();

const handlers = createResolverHandlers({
  repository: forgeCredentialRepository,
  validateWithAws: validateCredentialWithAws,
  now: () => new Date(),
  createRequestId: randomUUID,
  log: (event: SafeLogEvent) => console.info(JSON.stringify(event)),
  createResourceAdapter: createAwsResourceAdapter,
});

for (const [operation, handler] of Object.entries(handlers)) {
  resolver.define(operation, handler);
}

export const handler = resolver.getDefinitions();
