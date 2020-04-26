
export function getUrlParam(param: string) {
  const match = (new RegExp(`${param}=([^&]*)`)).exec(window.location.search);
  return match ? decodeURIComponent(match[1]) : '';
}

const macroKey = 'aws-widget-macro';

export const AP = (window as any).AP;

export const propertyKey = (uuid: string) => `${macroKey}-${uuid}-body`;