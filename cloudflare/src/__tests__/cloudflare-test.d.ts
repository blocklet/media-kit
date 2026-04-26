declare module 'cloudflare:test' {
  export const SELF: {
    fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
  };
}
