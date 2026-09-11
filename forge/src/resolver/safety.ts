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
  causeName?: string;
};

const safeCauseName = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null) return undefined;
  const name = Reflect.get(error, 'name');
  return typeof name === 'string' && /^[A-Za-z0-9_.-]{1,80}$/.test(name)
    ? name
    : undefined;
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
    const event: SafeLogEvent = {
      requestId,
      operation,
      outcomeCode: safeError.code,
      retryable: safeError.retryable,
    };
    const causeName = safeError.code === 'INTERNAL_ERROR'
      ? safeError.causeName ?? safeCauseName(error)
      : undefined;
    if (causeName) event.causeName = causeName;
    log(event);
    return {
      ok: false,
      error: { code: safeError.code, retryable: safeError.retryable },
      requestId,
    };
  }
};
