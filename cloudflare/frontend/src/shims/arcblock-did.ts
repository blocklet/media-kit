/**
 * Shim for @arcblock/did
 * Provides basic DID validation.
 */
export function isValid(did: string): boolean {
  if (!did || typeof did !== 'string') return false;
  return /^z[1-9A-HJ-NP-Za-km-z]{20,50}$/.test(did) || did.startsWith('did:abt:');
}
