import { test, expect } from '@playwright/test';
import {
  meetsThreshold,
  roundPercentage,
  computeCohortAttainment,
  attainmentVerdict,
} from '../../src/lib/obe';

/**
 * The floating-point boundary.
 *
 * Marks, percentages and thresholds are stored as `Float` (MySQL `DOUBLE`),
 * which cannot represent most decimal fractions exactly. The failure this
 * guards against is specific and severe: a student who scores *exactly* the
 * threshold lands a few ulps below it and is recorded as not achieving an
 * outcome they did achieve.
 *
 * `meetsThreshold()` decides every such comparison in the system. These are
 * pure-function tests — no browser, no database — because the property being
 * asserted is arithmetic, and pinning it here means the mitigation cannot be
 * quietly removed later.
 *
 * The `Decimal` column migration remains the textbook fix; until it happens
 * this is what stands between a rounding error and a student's transcript.
 */

test.describe('Threshold comparison survives floating-point error', () => {
  /**
   * These two are the real thing, not illustrations: a plain `>=` answers
   * *false* for both, so each one is a student marked down by arithmetic.
   */
  test('0.7 + 0.1 clears a 0.8 threshold', () => {
    const sum = 0.7 + 0.1; // 0.7999999999999999
    expect(sum >= 0.8, 'precondition: a plain >= fails here').toBe(false);
    expect(meetsThreshold(sum, 0.8)).toBe(true);
  });

  test('1 of 7 clears its own exact threshold', () => {
    const percentage = (1 / 7) * 100; // 14.285714285714285
    const threshold = 14.285714285714286;
    expect(
      percentage >= threshold,
      'precondition: a plain >= fails here'
    ).toBe(false);
    expect(meetsThreshold(percentage, threshold)).toBe(true);
  });

  test('7 of 9 clears a 77.77777777777777% threshold', () => {
    expect(meetsThreshold((7 / 9) * 100, 77.77777777777777)).toBe(true);
  });

  test('cases that happen to be exact still pass', () => {
    // 3/5 and 29/58 land on exactly 60 and 50 in IEEE-754. The guard must not
    // change the answer for the values that were never in danger.
    expect(meetsThreshold((3 / 5) * 100, 60)).toBe(true);
    expect(meetsThreshold((29 / 58) * 100, 50)).toBe(true);
  });

  test('a genuine near-miss is still a miss', () => {
    // The tolerance must not be so wide that it forgives real failures.
    expect(meetsThreshold(49.99, 50)).toBe(false);
    expect(meetsThreshold(59.9999, 60)).toBe(false);
  });

  test('a clear failure is still a failure', () => {
    expect(meetsThreshold(0, 50)).toBe(false);
    expect(meetsThreshold(25, 60)).toBe(false);
  });
});

test.describe('Stored percentages are not floating-point noise', () => {
  test('an exact-third attainment is rounded to a sane precision', () => {
    const raw = (1 / 3) * 100; // 33.33333333333333...
    expect(roundPercentage(raw)).toBe(33.3333);
  });

  test('a value that is already clean is left alone', () => {
    expect(roundPercentage(50)).toBe(50);
    expect(roundPercentage(100)).toBe(100);
  });

  test('60.00000000000001 is stored as 60', () => {
    expect(roundPercentage((3 / 5) * 100)).toBe(60);
  });
});

test.describe('Cohort attainment at the boundary', () => {
  test('three of five students at exactly the threshold is 60% and attained', () => {
    // Each student scored exactly 60% — the performance threshold — and the
    // cohort target is 60%. Both comparisons sit on the boundary at once.
    const performance = new Map<number, { obtained: number; total: number }>([
      [1, { obtained: 3, total: 5 }],
      [2, { obtained: 3, total: 5 }],
      [3, { obtained: 3, total: 5 }],
      [4, { obtained: 1, total: 5 }],
      [5, { obtained: 1, total: 5 }],
    ]);

    const result = computeCohortAttainment(performance, 5, {
      performance: 60,
      target: 60,
    });

    expect(result.studentsAchieved, 'the three at exactly 60% count').toBe(3);
    expect(result.attainmentPercent).toBe(60);
    expect(
      result.isAchieved,
      'a cohort exactly on target has met the target'
    ).toBe(true);
  });

  test('one of three passing is 33.3333% and misses a 50% target', () => {
    const performance = new Map<number, { obtained: number; total: number }>([
      [1, { obtained: 10, total: 10 }],
      [2, { obtained: 1, total: 10 }],
      [3, { obtained: 1, total: 10 }],
    ]);

    const result = computeCohortAttainment(performance, 3, {
      performance: 60,
      target: 50,
    });

    expect(result.attainmentPercent).toBe(33.3333);
    expect(result.isAchieved).toBe(false);
  });
});

test.describe('The stored verdict agrees at the boundary', () => {
  test('an attainment exactly on its target reads as attained', () => {
    expect(
      attainmentVerdict({
        attainmentPercent: (7 / 9) * 100,
        threshold: 60,
        targetThreshold: 77.77777777777777,
        isAchieved: null,
      })
    ).toBe('attained');
  });

  test('no target configured reports no_target rather than guessing', () => {
    expect(
      attainmentVerdict({
        attainmentPercent: 42,
        threshold: 60,
        targetThreshold: null,
        isAchieved: null,
      })
    ).toBe('no_target');
  });
});
