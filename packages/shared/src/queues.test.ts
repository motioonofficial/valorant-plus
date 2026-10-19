import { describe, expect, it } from 'vitest';
import { queueIdForFilter, queueName } from './queues.js';

describe('queueName', () => {
  it('names known queues, including custom games', () => {
    expect(queueName('competitive')).toBe('Rekabetçi');
    expect(queueName('')).toBe('Özel oyun');
  });

  it('falls back to the raw id for unknown queues', () => {
    expect(queueName('newmode')).toBe('newmode');
  });
});

describe('queueIdForFilter', () => {
  it('maps filters to queue ids', () => {
    expect(queueIdForFilter('all')).toBeNull();
    expect(queueIdForFilter('custom')).toBe('');
    expect(queueIdForFilter('unrated')).toBe('unrated');
  });
});
