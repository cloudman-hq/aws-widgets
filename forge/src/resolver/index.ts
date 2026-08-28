import Resolver from '@forge/resolver';
import {
  RESOLVER_OPERATIONS,
  type ResolverFailure,
  type ResolverOperation,
} from '../shared/contracts.js';

const resolver = new Resolver();

const unavailable = (operation: ResolverOperation): ResolverFailure => ({
  ok: false,
  error: { code: 'INTERNAL_ERROR', retryable: true },
  requestId: `not-implemented:${operation}`,
});

for (const operation of RESOLVER_OPERATIONS) {
  resolver.define(operation, () => unavailable(operation));
}

export const handler = resolver.getDefinitions();
