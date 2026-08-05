/**
 * Polyfills for React Native
 * Required by @solana/web3.js and other Solana libraries
 */

// Must be imported first
import 'react-native-get-random-values';
import 'text-encoding-polyfill';

// Buffer polyfill
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// URL polyfill
import { URL, URLSearchParams } from 'react-native-url-polyfill';
global.URL = URL;
global.URLSearchParams = URLSearchParams;

// atob/btoa polyfills
if (typeof global.atob === 'undefined') {
  global.atob = (input: string) => Buffer.from(input, 'base64').toString('binary');
}

if (typeof global.btoa === 'undefined') {
  global.btoa = (input: string) => Buffer.from(input, 'binary').toString('base64');
}

// TextEncoder/TextDecoder polyfill (from text-encoding-polyfill)
if (typeof global.TextEncoder === 'undefined') {
  const encoding = require('text-encoding-polyfill');
  global.TextEncoder = encoding.TextEncoder;
  global.TextDecoder = encoding.TextDecoder;
}

export {};
