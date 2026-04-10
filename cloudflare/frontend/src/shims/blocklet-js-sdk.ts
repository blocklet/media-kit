/**
 * Shim for @blocklet/js-sdk
 * Replaces createAxios with standard axios.create (with cookie credentials)
 */
import axios from 'axios';

export function createAxios(options?: { timeout?: number }) {
  return axios.create({
    timeout: options?.timeout || 200000,
    withCredentials: true,
  });
}
