import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';

// Only a local fake client can be constructed; these requests must fail
// before authentication, a database lookup, or any endpoint dispatch.
process.env.SUPABASE_URL = 'https://admin-test.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-service-role-key';
const { adminEndpoint } = await import('../netlify/functions/_shared/adminHttp.mjs');
const request = (body) => ({ httpMethod: 'POST', headers: {}, body: JSON.stringify(body) });

test('admin dispatch rejects non-string selectors before resolving capabilities', async () => {
  let selected = 0;
  let dispatched = 0;
  const handler = adminEndpoint({ capabilityFor: () => { selected++; return 'usage.read'; } }, async () => { dispatched++; });
  for (const field of ['action', 'view', 'format']) {
    for (const value of [['transcript'], {}, null, true, 1]) {
      const res = await handler(request({ [field]: value }));
      assert.equal(res.statusCode, 400, `${field}: ${JSON.stringify(value)}`);
      assert.match(JSON.parse(res.body).error, new RegExp(field));
    }
  }
  assert.equal(selected, 0, 'malformed input reached capability selection');
  assert.equal(dispatched, 0, 'malformed input reached dispatch');
});

test('every admin endpoint rejects array-valued action and view through the central envelope', async () => {
  const files = readdirSync(new URL('../netlify/functions/', import.meta.url))
    .filter((name) => /^admin-.*\.mjs$/.test(name));
  assert.ok(files.includes('admin-usage.mjs') && files.includes('admin-coupons.mjs') && files.includes('admin-actions.mjs'));
  for (const file of files) {
    const { handler } = await import(new URL(`../netlify/functions/${file}`, import.meta.url));
    for (const body of [{ action: ['pause'] }, { action: ['set_owner'] }, { view: ['transcript'] }, { format: ['csv'] }]) {
      const res = await handler(request(body));
      assert.equal(res.statusCode, 400, `${file}: ${JSON.stringify(body)}`);
    }
  }
});

test('string selectors and omitted selectors still pass to the capability gate', async () => {
  const selected = [];
  const handler = adminEndpoint({ capabilityFor: (body) => { selected.push(body); return 'usage.read'; } }, async () => ({}));
  for (const body of [{}, { action: 'pause', view: 'transcript', format: 'csv' }]) {
    const res = await handler(request(body));
    assert.equal(res.statusCode, 401, 'a valid selector still needs authentication');
  }
  assert.deepEqual(selected, [{}, { action: 'pause', view: 'transcript', format: 'csv' }]);
});
