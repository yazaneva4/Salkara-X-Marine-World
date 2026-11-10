import test from 'node:test';
import assert from 'node:assert/strict';

// A deployed build must never fall back to the defaults published in the repo.
// Each case imports lib/config.ts fresh (unique query) so module-level env
// evaluation happens under the env it sets up here.

const STRONG_SECRET = 'k'.repeat(48);

test('a deployment with no SESSION_SECRET and no passwords refuses every sign-in', async () => {
  process.env.VERCEL = '1';
  delete process.env.SESSION_SECRET;
  delete process.env.SALKARA_PASSWORD;
  delete process.env.MARINE_PASSWORD;
  const cfg = await import('../lib/config.ts?prod-unset');
  assert.equal(cfg.sessionsAvailable, false);
  assert.equal(cfg.accountsConfigured, false);
  assert.deepEqual(cfg.configProblems.length, 3);
  assert.equal(cfg.checkCredentials('salkara', 'salkara', 'salkara123'), false);
  assert.equal(cfg.checkCredentials('marine', 'marine', 'marine123'), false);
});

test('the placeholder values shipped in .env.example are refused in production', async () => {
  process.env.VERCEL = '1';
  process.env.SESSION_SECRET = 'change-me-to-a-long-random-string';
  process.env.SALKARA_PASSWORD = 'change-me-salkara';
  process.env.MARINE_PASSWORD = 'change-me-marine';
  const cfg = await import('../lib/config.ts?prod-placeholder');
  assert.equal(cfg.sessionsAvailable, false);
  assert.equal(cfg.accountsConfigured, false);
  assert.equal(cfg.checkCredentials('salkara', 'salkara', 'change-me-salkara'), false);
});

test('a configured deployment accepts only its own credentials', async () => {
  process.env.VERCEL = '1';
  process.env.SESSION_SECRET = STRONG_SECRET;
  process.env.SALKARA_PASSWORD = 'a-real-salkara-password';
  process.env.MARINE_PASSWORD = 'a-real-marine-password';
  const cfg = await import('../lib/config.ts?prod-ok');
  assert.equal(cfg.sessionsAvailable, true);
  assert.equal(cfg.accountsConfigured, true);
  assert.deepEqual(cfg.configProblems, []);
  assert.equal(cfg.checkCredentials('salkara', 'salkara', 'a-real-salkara-password'), true);
  assert.equal(cfg.checkCredentials('salkara', 'salkara', 'salkara123'), false);
  assert.equal(cfg.checkCredentials('marine', 'salkara', 'a-real-salkara-password'), false);
});

test('local development still runs on the documented defaults', async () => {
  delete process.env.VERCEL;
  delete process.env.NODE_ENV;
  delete process.env.SESSION_SECRET;
  delete process.env.SALKARA_PASSWORD;
  delete process.env.MARINE_PASSWORD;
  const cfg = await import('../lib/config.ts?dev');
  assert.equal(cfg.sessionsAvailable, true);
  assert.equal(cfg.accountsConfigured, true);
  assert.equal(cfg.checkCredentials('salkara', 'salkara', 'salkara123'), true);
  assert.equal(cfg.checkCredentials('marine', 'marine', 'marine123'), true);
});
