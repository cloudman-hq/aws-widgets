import Resolver from '@forge/resolver';
import { randomUUID } from 'node:crypto';
import {
  type ResolverFailure,
  type ResolverOperation,
} from '../shared/contracts.js';
import { validateCredentialWithAws } from './aws/credential-validator.js';
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
});

for (const [operation, handler] of Object.entries(handlers)) {
  resolver.define(operation, handler);
}

const unavailable = (operation: ResolverOperation): ResolverFailure => ({
  ok: false,
  error: { code: 'INTERNAL_ERROR', retryable: true },
  requestId: `not-implemented:${operation}`,
});

for (const operation of ['resource.list', 'resource.describe'] as const) {
  resolver.define(operation, () => unavailable(operation));
}

export const handler = resolver.getDefinitions();
