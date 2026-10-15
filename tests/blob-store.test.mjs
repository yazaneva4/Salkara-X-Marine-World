import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// Exercise independent store module instances against a shared conditional
// Blob implementation, including the actual encryption and storage options.
const stub = `export class BlobPreconditionFailedError extends Error {};
export const list = async () => ({ blobs: [] });
export const get = (...args) => globalThis.couponBlob.get(...args);
export const put = (...args) => globalThis.couponBlob.put(...args);`;
const blobUrl = 'data:text/javascript,' + encodeURIComponent(stub);
registerHooks({ resolve(name, context, next) {
  if (name === '@vercel/blob') return { url: blobUrl, shortCircuit: true };
  if (name === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true };
  if (name.startsWith('.') && context.parentURL?.includes('/lib/') && !/\.[a-z]+$/.test(name)) {
    return next(name + '.ts', context);
  }
  return next(name, context);
} });
process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_test';
const { BlobPreconditionFailedError } = await import('@vercel/blob');
const a = await import('../lib/store.ts?instance=a');
const b = await import('../lib/store.ts?instance=b');

const coupon = code => ({ code, name: code, issuedAt: '2026-10-15T00:00:00Z', validUntil: '2099-12-31', status: 'issued' });

test('independent coupon stores use ETags and preserve concurrent encrypted writes', async () => {
  let version = 0, data = null, conflicts = 0;
  globalThis.couponBlob = {
    get: async (_path, options) => {
      assert.equal(options.useCache, false);
      return data ? { statusCode: 200, stream: new Response(data).body, blob: { etag: String(version) } } : null;
    },
    put: async (_path, body, options) => {
      if (data ? options.ifMatch !== String(version) : options.allowOverwrite) {
        conflicts++; throw new BlobPreconditionFailedError('conflict');
      }
      data = Buffer.from(body); version++;
    },
  };
  await Promise.all([a.createCoupon(coupon('A')), b.createCoupon(coupon('B'))]);
  assert.deepEqual((await a.listCoupons()).map(c => c.code).sort(), ['A', 'B']);
  assert.ok(conflicts >= 1);
  assert.ok(!data.toString().includes('2099-12-31'), 'the payload stays encrypted');
});

test('an encrypted store that cannot be decrypted is never overwritten', async () => {
  let writes = 0;
  globalThis.couponBlob = {
    get: async () => ({ statusCode: 200, stream: new Response('corrupt').body, blob: { etag: 'bad' } }),
    put: async () => { writes++; },
  };
  await assert.rejects(() => a.createCoupon(coupon('C')));
  assert.equal(writes, 0);
});
