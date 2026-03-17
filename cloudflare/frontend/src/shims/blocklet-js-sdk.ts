/**
 * Shim for @blocklet/js-sdk
 * Replaces createAxios with standard axios.create
 */
import axios from 'axios';

export function createAxios(options?: { timeout?: number }) {
  return axios.create({
    timeout: options?.timeout || 200000,
  });
}
