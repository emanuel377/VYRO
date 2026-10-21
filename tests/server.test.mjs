import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';

const dataDir = mkdtempSync(join(tmpdir(), 'nova-test-'));
process.env.NOVA_DATA_DIR = dataDir;
const salt = randomBytes(16);
process.env.NOVA_ADMIN_USER = 'qa-admin';
process.env.NOVA_ADMIN_PASSWORD_HASH = `${salt.toString('hex')}:${scryptSync('test-only-password-1234',salt,64).toString('hex')}`;
process.env.NOVA_SESSION_SECRET = randomBytes(32).toString('hex');
const { server } = await import('../server/index.mjs');
let base;
before(async () => { await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}`; });
after(async () => { await new Promise(resolve => server.close(resolve)); });
const post = (path, body, options = {}) => fetch(base + path, { method:'POST', headers:{ Origin:base, 'content-type':'application/json', ...(options.headers||{}) }, body:JSON.stringify(body) });

test('serves agency, all demos, legal routes and assets', async () => {
  for (const path of ['/', '/demos/restaurante', '/demos/barberia', '/demos/clinica-dental', '/demos/tienda-ropa', '/demos/tienda-ropa/producto/1', '/terminos-y-condiciones', '/politica-de-privacidad', '/politica-de-cookies', '/politica-de-reembolsos']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), /VYRO/);
  }
  const image = await fetch(base + '/assets/brasa-hero.jpg');
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/jpeg');
  assert.ok((await image.arrayBuffer()).byteLength > 10_000);
  assert.equal((await fetch(base + '/demos/restaurante')).headers.get('x-robots-tag'), 'noindex, nofollow');
});

test('rejects invalid origin and invalid contact', async () => {
  const missingOrigin = await fetch(base + '/api/contact', { method:'POST', headers:{ 'content-type':'application/json' }, body:'{}' });
  assert.equal(missingOrigin.status, 403);
  const invalid = await post('/api/contact', { name:'P', contactType:'correo', contact:'bad', projectType:'Web', description:'short', privacy:false });
  assert.equal(invalid.status, 422);
  assert.match((await invalid.json()).error, /nombre/i);
});

test('stores request, separate terms acknowledgement, document versions and withdrawal event', async () => {
  const baseForm = { name:'Prueba QA', contactType:'correo', contact:'qa@example.test', projectType:'Web empresarial', description:'Proyecto de prueba automatizada, sin persona real.', privacy:true };
  const first = await post('/api/contact', { ...baseForm, terms:false });
  assert.equal(first.status, 201);
  const firstData = await first.json();
  assert.ok(firstData.requestId && firstData.withdrawalToken);
  const second = await post('/api/contact', { ...baseForm, terms:true });
  assert.equal(second.status, 201);
  const secondData = await second.json();
  const unauth = await fetch(base + '/api/admin/requests');
  assert.equal(unauth.status, 401);
  const login = await post('/api/admin/login', { user:'qa-admin', password:'test-only-password-1234' });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.match(login.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  const records = await fetch(base + '/api/admin/requests', { headers:{ Cookie:cookie } });
  assert.equal(records.status, 200);
  const data = await records.json();
  assert.equal(data.requests.length, 2);
  assert.equal(data.consents.filter(c=>c.request_id===firstData.requestId).length, 1);
  assert.equal(data.consents.filter(c=>c.request_id===secondData.requestId).length, 2);
  assert.ok(data.consents.every(c=>c.document_version && c.document_hash.length===64));
  assert.ok(data.consents.every(c=>c.document_version==='0.2-borrador'));
  const withdrawal = await post('/api/consent/withdraw', firstData);
  assert.equal(withdrawal.status, 200);
  const afterWithdrawal = await (await fetch(base + '/api/admin/requests', { headers:{ Cookie:cookie } })).json();
  assert.ok(afterWithdrawal.consents.some(c=>c.request_id===firstData.requestId && c.state==='retirado'));
  assert.equal(afterWithdrawal.requests.find(r=>r.id===firstData.requestId).status, 'retirada_solicitada');
  const exportResponse = await fetch(base + '/api/admin/export', { headers:{ Cookie:cookie } });
  assert.equal(exportResponse.status, 200);
  const evidence = await exportResponse.json();
  assert.ok(evidence.documents.length>=4 && evidence.auditEvents.length>=3);
  assert.ok(evidence.documents.some(doc=>doc.version==='0.2-borrador'));
});

test('does not expose private files or accept oversize data', async () => {
  assert.equal((await fetch(base + '/api/admin/export')).status, 401);
  const oversized = await post('/api/contact', { name:'Prueba QA', contactType:'correo', contact:'qa@example.test', projectType:'Web', description:'a'.repeat(21000), privacy:true });
  assert.equal(oversized.status, 400);
  assert.equal((await fetch(base + '/server/index.mjs')).status, 404);
  assert.equal((await fetch(base + '/assets/brasa-hero.png')).status, 404);
  assert.equal((await fetch(base + '/%')).status, 400);
});
