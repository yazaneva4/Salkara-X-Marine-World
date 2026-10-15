import test from 'node:test';
import assert from 'node:assert/strict';
import { updateSnapshot } from '../lib/storage-update.ts';

test('concurrent writers retry with the latest ETag and preserve both coupons', async () => {
  let data = [], etag = 0;
  const read = async () => ({ coupons: structuredClone(data), etag: String(etag) });
  const write = async (coupons, expected) => {
    if (expected !== String(etag)) throw new Error('conflict');
    data = structuredClone(coupons); etag++;
  };
  const update = name => updateSnapshot(read, write, coupons => coupons.push(name), error => error.message === 'conflict');
  await Promise.all([update('A'), update('B')]);
  assert.deepEqual(data.sort(), ['A', 'B']);
});

test('unreadable or corrupt storage is never replaced by an empty store', async () => {
  let writes = 0;
  await assert.rejects(() => updateSnapshot(async () => { throw new Error('corrupt'); }, async () => { writes++; }, () => {}, () => true), /corrupt/);
  assert.equal(writes, 0);
});

test('storage outages are not retried as write conflicts', async () => {
  let writes = 0;
  await assert.rejects(() => updateSnapshot(async () => ({ coupons: [], etag: null }), async () => { writes++; throw new Error('outage'); }, () => {}, () => false), /outage/);
  assert.equal(writes, 1);
});
