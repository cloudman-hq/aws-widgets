import type {
  PublicErrorCode,
  ResolverEnvelope,
  ResolverOperation,
} from '../shared/contracts';
import { PublicResolverError } from './errors';

export type SafeLogEvent = {
  requestId: string;
  operation: ResolverOperation;
  outcomeCode: 'OK' | PublicErrorCode;
  retryable: boolean;
};

export const toSafeEnvelope = async <T>(
  requestId: string,
  operation: ResolverOperation,
  execute: () => Promise<T>,
  log: (event: SafeLogEvent) => void,
): Promise<ResolverEnvelope<T>> => {
  try {
    const data = await execute();
    log({ requestId, operation, outcomeCode: 'OK', retryable: false });
    return { ok: true, data, requestId };
  } catch (error: unknown) {
    const safeError =
      error instanceof PublicResolverError
        ? error
        : new PublicResolverError('INTERNAL_ERROR', true);
    log({
      requestId,
      operation,
      outcomeCode: safeError.code,
      retryable: safeError.retryable,
    });
    return {
      ok: false,
      error: { code: safeError.code, retryable: safeError.retryable },
      requestId,
    };
  }
};
