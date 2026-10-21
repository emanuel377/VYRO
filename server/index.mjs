import http from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, createHash, createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { studio, privacyConsentText, termsAcknowledgementText } from './config.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const publicDir = join(root, 'public');
const dataDir = resolve(process.env.NOVA_DATA_DIR || join(root, 'data'));
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(join(dataDir, 'nova.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS LegalDocument (id TEXT PRIMARY KEY, type TEXT NOT NULL, version TEXT NOT NULL, effective_at TEXT NOT NULL, content TEXT NOT NULL, hash TEXT NOT NULL, published_at TEXT);
CREATE TABLE IF NOT EXISTS ContactRequest (id TEXT PRIMARY KEY, name TEXT NOT NULL, contact_type TEXT NOT NULL, contact TEXT NOT NULL, business TEXT, project_type TEXT NOT NULL, description TEXT NOT NULL, budget TEXT, created_at TEXT NOT NULL, status TEXT NOT NULL, withdrawal_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ConsentEvent (id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES ContactRequest(id), subject_id TEXT NOT NULL, consent_type TEXT NOT NULL, purpose TEXT NOT NULL, state TEXT NOT NULL, created_at TEXT NOT NULL, document_version TEXT NOT NULL, document_hash TEXT NOT NULL, accepted_text TEXT NOT NULL, origin_form TEXT NOT NULL, route TEXT NOT NULL, method TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS AuditEvent (id TEXT PRIMARY KEY, action TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL, reference_id TEXT, result TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_consent_request ON ConsentEvent(request_id);`);

const documents = JSON.parse(readFileSync(join(publicDir, 'legal.json'), 'utf8'));
for (const [type, doc] of Object.entries(documents)) {
  const content = JSON.stringify(doc);
  const hash = createHash('sha256').update(content).digest('hex');
  const previous = db.prepare('SELECT hash FROM LegalDocument WHERE id=?').get(`${type}:${doc.version}`);
  if (previous && previous.hash !== hash) throw new Error(`El documento ${type} cambió sin aumentar la versión ${doc.version}.`);
  db.prepare('INSERT OR IGNORE INTO LegalDocument VALUES (?,?,?,?,?,?,?)').run(`${type}:${doc.version}`, type, doc.version, doc.effectiveAt, content, hash, null);
}

const json = (res, status, value, extra = {}) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra });
  res.end(JSON.stringify(value));
};
const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
};
const id = () => randomBytes(16).toString('hex');
const hash = value => createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
const text = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const emailValid = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const phoneValid = value => /^\+?[\d\s()-]{8,22}$/.test(value);
const rate = new Map();
const limited = (req, key, max, windowMs) => {
  const at = Date.now();
  const label = `${req.socket.remoteAddress}:${key}`;
  const history = (rate.get(label) || []).filter(time => at - time < windowMs);
  history.push(at); rate.set(label, history);
  return history.length > max;
};
const validOrigin = req => {
  const origin = req.headers.origin;
  if (!origin) return false;
  return origin === (process.env.NOVA_PUBLIC_ORIGIN || `http://${req.headers.host}`);
};
const readJson = async req => {
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new Error('content-type');
  let total = 0; const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > 20_000) throw new Error('size');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};
const sessionSecret = process.env.NOVA_SESSION_SECRET || '';
const adminUser = process.env.NOVA_ADMIN_USER || '';
const adminHash = process.env.NOVA_ADMIN_PASSWORD_HASH || '';
const adminEnabled = sessionSecret.length >= 32 && adminUser.length > 0 && /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(adminHash);
const sessions = new Map();
const adminFrom = req => {
  if (!adminEnabled) return false;
  const token = /(?:^|;\s*)nova_session=([^;]+)/.exec(req.headers.cookie || '')?.[1];
  if (!token) return false;
  const [sid, signature] = token.split('.');
  if (!sid || !signature) return false;
  const expected = createHmac('sha256', sessionSecret).update(sid).digest('hex');
  if (!safeEqual(signature, expected)) return false;
  const expires = sessions.get(sid);
  if (!expires || expires < Date.now()) return false;
  return true;
};
const audit = (action, actor, reference, result) => db.prepare('INSERT INTO AuditEvent VALUES (?,?,?,?,?,?)').run(id(), action, actor, now(), reference, result);

function saveContact(body) {
  const name = text(body.name, 100), contact = text(body.contact, 160), contactType = text(body.contactType, 20);
  const projectType = text(body.projectType, 80), description = text(body.description, 3000);
  const business = text(body.business, 100), budget = text(body.budget, 80);
  const error = !name || name.length < 2 ? 'Ingresá tu nombre.'
    : !['correo', 'whatsapp'].includes(contactType) ? 'Elegí un medio de contacto.'
    : !(contactType === 'correo' ? emailValid(contact) : phoneValid(contact)) ? 'Revisá el medio de contacto.'
    : !projectType ? 'Elegí el tipo de página.'
    : description.length < 15 ? 'Contanos un poco más sobre tu proyecto.'
    : body.privacy !== true ? 'Necesitamos tu autorización específica para responder esta solicitud.'
    : null;
  if (error) return { error };
  const requestId = id(), withdrawalToken = randomBytes(24).toString('hex'), created = now();
  const privacyDoc = db.prepare('SELECT version,hash FROM LegalDocument WHERE type=? ORDER BY effective_at DESC, version DESC LIMIT 1').get('privacidad');
  const termsDoc = db.prepare('SELECT version,hash FROM LegalDocument WHERE type=? ORDER BY effective_at DESC, version DESC LIMIT 1').get('terminos');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('INSERT INTO ContactRequest VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(requestId, name, contactType, contact, business, projectType, description, budget, created, 'nueva', hash(withdrawalToken));
    db.prepare('INSERT INTO ConsentEvent VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id(), requestId, requestId, 'privacidad_cotizacion', 'Responder la solicitud de cotización', 'otorgado', created, privacyDoc.version, privacyDoc.hash, privacyConsentText, 'cotizacion', '/#contacto', 'casilla independiente');
    if (body.terms === true) db.prepare('INSERT INTO ConsentEvent VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id(), requestId, requestId, 'lectura_terminos', 'Constancia de lectura, sin formación de contrato', 'reconocido', created, termsDoc.version, termsDoc.hash, termsAcknowledgementText, 'cotizacion', '/#contacto', 'casilla independiente');
    audit('contact.create', 'visitor', requestId, 'ok');
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  return { requestId, withdrawalToken };
}

const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml; charset=utf-8' };
function serveFile(res, pathname) {
  let candidate;
  try { candidate = resolve(publicDir, `.${decodeURIComponent(pathname)}`); }
  catch { return json(res, 400, { error: 'Ruta inválida.' }); }
  if (candidate !== publicDir && !candidate.startsWith(publicDir + sep)) return json(res, 404, { error: 'No encontrado.' });
  if (extname(candidate) && !existsSync(candidate)) return json(res, 404, { error: 'No encontrado.' });
  const file = existsSync(candidate) && extname(candidate) ? candidate : join(publicDir, 'index.html');
  try {
    const content = readFileSync(file);
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(content);
  } catch { json(res, 404, { error: 'No encontrado.' }); }
}

export const server = http.createServer(async (req, res) => {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('content-security-policy', "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'");
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/config' && req.method === 'GET') return json(res, 200, { studio, privacyConsentText, termsAcknowledgementText, adminEnabled });
  if (url.pathname === '/api/contact' && req.method === 'POST') {
    if (!validOrigin(req)) return json(res, 403, { error: 'Origen no permitido.' });
    if (limited(req, 'contact', 5, 60_000)) return json(res, 429, { error: 'Esperá un momento antes de volver a intentar.' });
    try {
      const body = await readJson(req);
      if (body.website) return json(res, 400, { error: 'No se pudo procesar la solicitud.' });
      const result = saveContact(body);
      return result.error ? json(res, 422, result) : json(res, 201, { ...result, message: 'Solicitud recibida en el servidor local. No se envió ningún correo.' });
    } catch { return json(res, 400, { error: 'Solicitud inválida.' }); }
  }
  if (url.pathname === '/api/consent/withdraw' && req.method === 'POST') {
    if (!validOrigin(req)) return json(res, 403, { error: 'Origen no permitido.' });
    if (limited(req, 'withdraw', 10, 60_000)) return json(res, 429, { error: 'Intentá de nuevo más tarde.' });
    try {
      const body = await readJson(req);
      const request = db.prepare('SELECT id FROM ContactRequest WHERE id=? AND withdrawal_hash=?').get(text(body.requestId, 40), hash(text(body.withdrawalToken, 100)));
      if (!request) return json(res, 404, { error: 'No encontramos esa solicitud.' });
      const doc = db.prepare('SELECT version,hash FROM LegalDocument WHERE type=? ORDER BY effective_at DESC, version DESC LIMIT 1').get('privacidad');
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT INTO ConsentEvent VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id(), request.id, request.id, 'privacidad_cotizacion', 'Retirada de autorización para atender la solicitud', 'retirado', now(), doc.version, doc.hash, 'Solicito retirar mi autorización de tratamiento para esta cotización.', 'gestion_consentimiento', '/retirar-consentimiento', 'token de solicitud');
        db.prepare('UPDATE ContactRequest SET status=? WHERE id=?').run('retirada_solicitada', request.id);
        audit('consent.withdraw', 'subject', request.id, 'ok'); db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
      return json(res, 200, { message: 'Retirada registrada. Revisaremos la conservación de los datos conforme a las obligaciones aplicables.' });
    } catch { return json(res, 400, { error: 'Solicitud inválida.' }); }
  }
  if (url.pathname === '/api/admin/login' && req.method === 'POST') {
    if (!adminEnabled) return json(res, 503, { error: 'Administración no configurada.' });
    if (!validOrigin(req)) return json(res, 403, { error: 'Origen no permitido.' });
    if (limited(req, 'login', 5, 300_000)) return json(res, 429, { error: 'Demasiados intentos.' });
    try {
      const body = await readJson(req), [salt, expected] = adminHash.split(':');
      const actual = scryptSync(String(body.password || ''), Buffer.from(salt, 'hex'), 64).toString('hex');
      if (!safeEqual(text(body.user, 100), adminUser) || !safeEqual(actual, expected)) { audit('admin.login', 'unknown', null, 'denied'); return json(res, 401, { error: 'Credenciales incorrectas.' }); }
      const sid = id(), signature = createHmac('sha256', sessionSecret).update(sid).digest('hex');
      sessions.set(sid, Date.now() + 30 * 60_000); audit('admin.login', adminUser, null, 'ok');
      const secure = process.env.NOVA_PUBLIC_ORIGIN?.startsWith('https://') ? '; Secure' : '';
      return json(res, 200, { ok: true }, { 'set-cookie': `nova_session=${sid}.${signature}; HttpOnly; SameSite=Strict; Path=/; Max-Age=1800${secure}` });
    } catch { return json(res, 400, { error: 'Solicitud inválida.' }); }
  }
  if (url.pathname.startsWith('/api/admin/')) {
    if (!adminFrom(req)) return json(res, 401, { error: 'Acceso restringido.' });
    if (url.pathname === '/api/admin/requests' && req.method === 'GET') {
      const requests = db.prepare('SELECT id,name,contact_type,contact,business,project_type,description,budget,created_at,status FROM ContactRequest ORDER BY created_at DESC LIMIT 200').all();
      const consents = db.prepare('SELECT * FROM ConsentEvent ORDER BY created_at DESC LIMIT 500').all();
      return json(res, 200, { requests, consents });
    }
    if (url.pathname === '/api/admin/export' && req.method === 'GET') {
      audit('admin.export', adminUser, null, 'ok');
      return json(res, 200, { exportedAt: now(), documents: db.prepare('SELECT * FROM LegalDocument').all(), requests: db.prepare('SELECT * FROM ContactRequest').all(), consentEvents: db.prepare('SELECT * FROM ConsentEvent').all(), auditEvents: db.prepare('SELECT * FROM AuditEvent').all() }, { 'content-disposition': 'attachment; filename="vyro-evidence.json"' });
    }
    if (url.pathname === '/api/admin/logout' && req.method === 'POST') {
      if (!validOrigin(req)) return json(res, 403, { error: 'Origen no permitido.' });
      const sid = /nova_session=([^.;]+)/.exec(req.headers.cookie || '')?.[1]; if (sid) sessions.delete(sid);
      return json(res, 200, { ok: true }, { 'set-cookie': 'nova_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
    }
    return json(res, 404, { error: 'No encontrado.' });
  }
  if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'No encontrado.' });
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Método no permitido.' });
  if (url.pathname.startsWith('/demos/') || ['/admin','/retirar-consentimiento','/terminos-y-condiciones','/politica-de-privacidad','/politica-de-cookies','/politica-de-reembolsos'].includes(url.pathname)) res.setHeader('x-robots-tag', 'noindex, nofollow');
  return serveFile(res, url.pathname);
});

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  server.listen(port, process.env.HOST || '0.0.0.0', () => console.log(`VYRO local: http://${process.env.HOST || '127.0.0.1'}:${port}`));
}
