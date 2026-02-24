// Lightweight ID obfuscation for client→server API requests.
// Not cryptographic — just prevents raw UUIDs from being visible in network traffic.

export function encodeId(id: string): string {
  const reversed = id.split('').reverse().join('');
  return btoa(reversed);
}

export function decodeId(encoded: string): string {
  const reversed = atob(encoded);
  return reversed.split('').reverse().join('');
}
