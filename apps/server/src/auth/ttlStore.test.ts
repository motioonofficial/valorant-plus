import { describe, expect, it } from 'vitest';
import { TtlStore } from './ttlStore.js';

describe('TtlStore', () => {
  it('returns a value only once', () => {
    const store = new TtlStore<string>(1000);
    store.set('a', 'x');
    expect(store.take('a')).toBe('x');
    expect(store.take('a')).toBeUndefined();
  });

  it('expires values after the ttl', () => {
    let now = 0;
    const store = new TtlStore<string>(1000, () => now);
    store.set('a', 'x');
    now = 1001;
    expect(store.take('a')).toBeUndefined();
  });
});
