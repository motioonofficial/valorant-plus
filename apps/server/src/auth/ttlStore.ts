/**
 * In-memory store for short-lived values (OAuth state, one-time login codes).
 * Good enough for a single server instance; swap for Redis when scaling out.
 */
export class TtlStore<T> {
  private readonly items = new Map<string, { value: T; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  set(key: string, value: T): void {
    this.sweep();
    this.items.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }

  /** Returns the value once and removes it. */
  take(key: string): T | undefined {
    const item = this.items.get(key);
    this.items.delete(key);
    if (!item || item.expiresAt < this.now()) return undefined;
    return item.value;
  }

  private sweep(): void {
    const now = this.now();
    for (const [key, item] of this.items) if (item.expiresAt < now) this.items.delete(key);
  }
}
