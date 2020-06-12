import * as CryptoJS from 'crypto-js';

export function getUrlParam(param: string) {
  const match = (new RegExp(`${param}=([^&]*)`)).exec(window.location.search);
  return match ? decodeURIComponent(match[1]) : '';
}

function getKey(): string {
  const clientDomain = getUrlParam('xdm_e');
  return `${macroKey}${clientDomain ? ` ${clientDomain}` : ''}`;
}

export function encrypt(data: any): string {
  const cipherText = CryptoJS.AES.encrypt(JSON.stringify(data), getKey()).toString();
  return JSON.stringify({ encrypted: cipherText });
}

export function decrypt(data: any): any {
  try {
    const cipherText = data.encrypted;
    if (cipherText) {
      const bytes = CryptoJS.AES.decrypt(cipherText, getKey());
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    }
  } catch (e) {
    log('Error in decryption, fallback to original text', e);
  }
  return data;
}

const macroKey = 'aws-widget-macro';

export const AP = (window as any).AP;

export const propertyKey = (uuid: string) => `${macroKey}-${uuid}-body`;

export function log(...args: any[]) {
  // tslint:disable-next-line: no-console
  console.log(...args);
}

export function debug(...args: any[]) {
  // tslint:disable-next-line: no-console
  console.debug(...args);
}
