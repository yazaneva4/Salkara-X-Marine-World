import test from 'node:test';
import assert from 'node:assert/strict';
import { validCouponDate, couponExpired } from '../lib/coupon.ts';

test('coupon dates must exist on the calendar', () => {
  for (const date of ['2026-02-30', '2026-13-01', '2026-02-29', null, {}, 'bad']) assert.equal(validCouponDate(date), false);
  assert.equal(validCouponDate('2028-02-29'), true);
});

test('coupon expires at midnight Saudi time, including its last valid day', () => {
  assert.equal(couponExpired('2026-10-15', new Date('2026-10-15T20:59:59Z')), false);
  assert.equal(couponExpired('2026-10-15', new Date('2026-10-15T21:00:00Z')), true);
  assert.equal(couponExpired('invalid'), true);
});
