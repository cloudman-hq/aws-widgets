import { PublicResolverError } from './errors';

export const SETTINGS_MODULE_KEY = 'aws-widgets-settings';
export const MACRO_MODULE_KEY = 'aws-widget-macro';

export type ResolverContext = {
  accountId?: unknown;
  moduleKey?: unknown;
};

export const authorizeModule = (context: ResolverContext, moduleKey: string): void => {
  if (
    typeof context.accountId !== 'string' ||
    context.accountId.length === 0 ||
    context.moduleKey !== moduleKey
  ) {
    throw new PublicResolverError('UNAUTHORIZED');
  }
};
