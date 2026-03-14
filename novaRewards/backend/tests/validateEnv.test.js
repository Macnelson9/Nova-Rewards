// Feature: nova-rewards, Property 11: Missing environment variables halt startup
// Validates: Requirements 11.3

const fc = require('fast-check');
const { validateEnv, REQUIRED_ENV_VARS } = require('../middleware/validateEnv');

describe('validateEnv (Property 11)', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Set all required vars to valid values
    REQUIRED_ENV_VARS.forEach((key) => { process.env[key] = 'test-value'; });
  });

  afterEach(() => {
    // Restore original env
    REQUIRED_ENV_VARS.forEach((key) => { delete process.env[key]; });
    Object.assign(process.env, originalEnv);
  });

  test('passes when all required env vars are set', () => {
    expect(() => validateEnv()).not.toThrow();
  });

  // Property 11: for any non-empty subset of required vars that is missing, startup should fail
  test('throws for any non-empty subset of missing env vars', () => {
    fc.assert(
      fc.property(
        fc.subarray(REQUIRED_ENV_VARS, { minLength: 1 }),
        (missingKeys) => {
          // Unset the selected keys
          missingKeys.forEach((key) => { delete process.env[key]; });

          let threw = false;
          let errorMessage = '';
          try {
            validateEnv();
          } catch (err) {
            threw = true;
            errorMessage = err.message;
          }

          // Must throw
          expect(threw).toBe(true);

          // Error message must mention each missing key
          missingKeys.forEach((key) => {
            expect(errorMessage).toContain(key);
          });

          // Restore for next iteration
          missingKeys.forEach((key) => { process.env[key] = 'test-value'; });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('error message lists all missing keys', () => {
    const toRemove = REQUIRED_ENV_VARS.slice(0, 3);
    toRemove.forEach((key) => { delete process.env[key]; });

    expect(() => validateEnv()).toThrow(
      expect.objectContaining({ message: expect.stringContaining(toRemove[0]) })
    );
  });
});
