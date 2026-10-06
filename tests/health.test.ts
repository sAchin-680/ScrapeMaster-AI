import { describe, expect, it } from 'vitest';
import {
  CIRCUIT,
  CircuitOpenError,
  circuitState,
  HealthRegistry,
  successRate,
} from '@/lib/scraper/health';

const ref = {
  source: 'amazon:search',
  store: 'amazon',
  storeName: 'Amazon',
  kind: 'search',
};

function clock(start = Date.parse('2026-10-06T00:00:00Z')) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe('HealthRegistry circuit breaker', () => {
  it('opens after consecutive failures and skips the source', () => {
    const c = clock();
    const reg = new HealthRegistry([], c.now, () => 0.5);
    for (let i = 0; i < CIRCUIT.threshold; i++)
      reg.record(ref, false, new Error('captcha'));
    expect(circuitState(reg.all()[0], c.now())).toBe('open');
    expect(() => reg.assertCanAttempt('amazon:search')).toThrow(CircuitOpenError);
    expect(reg.runStats().get('amazon:search')?.skipped).toBe(1);
  });

  it('allows one trial after the cooldown and closes on success', () => {
    const c = clock();
    const reg = new HealthRegistry([], c.now, () => 0.5);
    for (let i = 0; i < CIRCUIT.threshold; i++) reg.record(ref, false);
    c.advance(CIRCUIT.cooldownMs + 1);
    expect(circuitState(reg.all()[0], c.now())).toBe('half-open');
    expect(() => reg.assertCanAttempt('amazon:search')).not.toThrow();
    reg.record(ref, true);
    expect(circuitState(reg.all()[0], c.now())).toBe('closed');
    expect(reg.all()[0].consecutiveFailures).toBe(0);
  });

  it('re-opens immediately when the trial fails', () => {
    const c = clock();
    const reg = new HealthRegistry([], c.now, () => 0.5);
    for (let i = 0; i < CIRCUIT.threshold; i++) reg.record(ref, false);
    c.advance(CIRCUIT.cooldownMs + 1);
    reg.record(ref, false);
    expect(circuitState(reg.all()[0], c.now())).toBe('open');
  });

  it('a success resets the failure streak before the threshold', () => {
    const reg = new HealthRegistry();
    reg.record(ref, false);
    reg.record(ref, false);
    reg.record(ref, true);
    reg.record(ref, false);
    expect(circuitState(reg.all()[0])).toBe('closed');
  });

  it('tracks a rolling success rate and restores persisted state', () => {
    const reg = new HealthRegistry();
    [true, true, false, true].forEach((ok) => reg.record(ref, ok));
    const restored = new HealthRegistry(reg.all());
    expect(successRate(restored.all()[0])).toBe(0.75);
    for (let i = 0; i < CIRCUIT.window + 10; i++) restored.record(ref, true);
    expect(restored.all()[0].recent).toHaveLength(CIRCUIT.window);
  });
});
