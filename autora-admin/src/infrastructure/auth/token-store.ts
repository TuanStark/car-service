/**
 * In-memory access token holder for privileged admin sessions.
 * Never persists JWT access tokens to localStorage or sessionStorage.
 */
class MemoryTokenStore {
  private accessToken: string | null = null;

  get(): string | null {
    return this.accessToken;
  }

  set(token: string | null): void {
    this.accessToken = token;
  }

  clear(): void {
    this.accessToken = null;
  }
}

export const tokenStore = new MemoryTokenStore();

