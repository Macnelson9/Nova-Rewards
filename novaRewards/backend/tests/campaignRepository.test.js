// Feature: nova-rewards, Property 3: Campaign validation rejects invalid inputs
// Validates: Requirements 7.3

const fc = require('fast-check');
const { validateCampaign } = require('../db/campaignRepository');

// Arbitrary for a valid ISO date string (2020–2030)
const dateArb = fc.date({
  min: new Date('2020-01-01'),
  max: new Date('2030-12-31'),
}).map((d) => d.toISOString().slice(0, 10));

describe('validateCampaign (Property 3)', () => {
  // Property: non-positive reward rates are always rejected
  test('rejects reward rate <= 0 for any date range', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(0),
          fc.float({ max: 0, noNaN: true }),
          fc.integer({ max: -1 }),
        ),
        dateArb,
        dateArb,
        (rewardRate, startDate, endDate) => {
          const { valid, errors } = validateCampaign({ rewardRate, startDate, endDate });
          expect(valid).toBe(false);
          expect(errors.some((e) => e.toLowerCase().includes('reward'))).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: end date <= start date is always rejected
  test('rejects end date that is not strictly after start date', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        dateArb,
        (rewardRate, date) => {
          // Same date: end === start
          const { valid: v1, errors: e1 } = validateCampaign({
            rewardRate,
            startDate: date,
            endDate: date,
          });
          expect(v1).toBe(false);
          expect(e1.some((e) => e.toLowerCase().includes('end'))).toBe(true);

          // End before start
          const start = new Date(date);
          start.setDate(start.getDate() + 1);
          const futureStart = start.toISOString().slice(0, 10);
          const { valid: v2 } = validateCampaign({
            rewardRate,
            startDate: futureStart,
            endDate: date,
          });
          expect(v2).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: valid inputs always pass
  test('accepts valid campaign inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        dateArb,
        (rewardRate, startDate) => {
          // End date is always 1 day after start
          const end = new Date(startDate);
          end.setDate(end.getDate() + 1);
          const endDate = end.toISOString().slice(0, 10);

          const { valid, errors } = validateCampaign({ rewardRate, startDate, endDate });
          expect(valid).toBe(true);
          expect(errors).toHaveLength(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
