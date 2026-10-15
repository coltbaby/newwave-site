const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL.test(email);
}

function streamToString(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const raw = typeof req.body === 'string' ? req.body
    : Buffer.isBuffer(req.body) ? req.body.toString('utf8')
    : await streamToString(req);
  const type = String(req.headers?.['content-type'] || '');
  if (!raw) return {};
  if (type.includes('application/json') || raw.trim().startsWith('{')) return JSON.parse(raw);
  return Object.fromEntries(new URLSearchParams(raw));
}

function isDuplicate(status, text) {
  if (status === 409) return true;
  if (status !== 422) return false;
  return /already exists|duplicate/i.test(text);
}

const ALLOWED_ORIGINS = new Set([
  'https://www.newwavestack.com',
  'https://newwavestack.com',
  'https://nwwv.studio',
  'https://www.nwwv.studio',
]);

function allowedOrigin(req) {
  const origin = String(req.headers?.origin || '');
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  const referer = String(req.headers?.referer || req.headers?.referrer || '');
  if (!referer) return '';
  try {
    const fromReferer = new URL(referer).origin;
    if (ALLOWED_ORIGINS.has(fromReferer)) return fromReferer;
  } catch {
    /* ignore a malformed referer */
  }
  return '';
}

function setCors(req, res) {
  const origin = allowedOrigin(req);
  if (!origin) return;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(204);
    return res.end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const key = process.env.RESEND_API_KEY;
  const segment = process.env.RESEND_SEGMENT_ID;
  if (!key || !segment) {
    console.error('subscribe: missing RESEND_API_KEY or RESEND_SEGMENT_ID');
    return res.status(500).json({ ok: false, error: 'Something went wrong. Try again.' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    console.error('subscribe: bad body', err);
    return res.status(400).json({ ok: false, error: 'Invalid request' });
  }

  const honeypot = String(body.website_url ?? body.company ?? '').trim();
  if (honeypot) return res.status(200).json({ ok: true });

  const email = String(body.email ?? '').trim();
  if (!validEmail(email)) {
    return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });
  }

  try {
    const r = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false, segments: [{ id: segment }] }),
    });
    if (r.ok) return res.status(200).json({ ok: true });
    const detail = await r.text();
    if (isDuplicate(r.status, detail)) return res.status(200).json({ ok: true });
    console.error('subscribe: resend', r.status, detail);
    return res.status(502).json({ ok: false, error: 'Something went wrong. Try again.' });
  } catch (err) {
    console.error('subscribe: request failed', err);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Try again.' });
  }
}
