const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTERESTS = [
  'Creative Audit',
  'Backstop retainer',
  'Launch Round',
  'Workflow Setup',
  'CD Advisory',
  'Not sure',
];
const BUDGETS = [
  'Under $1,000',
  '$1,000–$2,500',
  '$2,500–$5,000',
  '$5,000–$10,000',
  '$10,000+',
];
const PLANS = ['Core', 'Plus', 'Premium', 'Full Agency'];
const FROM = 'NwWv Studio <studio@newwavestack.com>';

function validEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL.test(email) && !/[\r\n]/.test(email);
}

function textField(value, max) {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  if (!v || v.length > max || /[\r\n]/.test(v)) return '';
  return v;
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
  if (raw.length > 20000) throw new Error('body too large');
  if (type.includes('application/json') || raw.trim().startsWith('{')) return JSON.parse(raw);
  return Object.fromEntries(new URLSearchParams(raw));
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

function fail(res, status, error) {
  return res.status(status).json({ ok: false, error });
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
    return fail(res, 405, 'Method not allowed');
  }

  const key = process.env.RESEND_API_KEY;
  const to = String(process.env.INQUIRY_TO_EMAIL || '').trim();
  if (!to) {
    console.error('inquiry: INQUIRY_TO_EMAIL is not set. Set it in the Vercel project environment.');
    return fail(res, 500, 'Something went wrong. Try again.');
  }
  if (!validEmail(to)) {
    console.error('inquiry: INQUIRY_TO_EMAIL is not a valid email address.');
    return fail(res, 500, 'Something went wrong. Try again.');
  }
  if (!key) {
    console.error('inquiry: missing RESEND_API_KEY');
    return fail(res, 500, 'Something went wrong. Try again.');
  }

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    console.error('inquiry: bad body', err);
    return fail(res, 400, 'Invalid request');
  }

  if (String(body.website_url ?? '').trim()) return res.status(200).json({ ok: true });

  const name = textField(body.name, 120);
  const email = textField(body.email, 254);
  const brand = textField(body.brand, 160);
  const link = textField(body.link, 300);
  const interest = textField(body.interest, 40);
  const budget = typeof body.budget === 'string' ? body.budget.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const plan = textField(body.plan, 40);

  if (!name) return fail(res, 400, 'Enter your name.');
  if (!validEmail(email)) return fail(res, 400, 'Enter a valid email address.');
  if (!brand) return fail(res, 400, 'Enter a brand or company.');
  if (!link || !(/[@.]/.test(link) || /^https?:\/\//i.test(link))) {
    return fail(res, 400, 'Enter a website or social link.');
  }
  if (!INTERESTS.includes(interest)) return fail(res, 400, 'Choose an interest.');
  if (budget && !BUDGETS.includes(budget)) return fail(res, 400, 'Choose a budget range.');
  if (message.length > 2000) return fail(res, 400, 'Message is too long.');
  if (/[\u0000]/.test(message)) return fail(res, 400, 'Invalid request');

  const retainerPlan = interest === 'Backstop retainer' && PLANS.includes(plan) ? plan : '';
  const lines = [
    'NwWv Studio inquiry',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Brand: ${brand}`,
    `Link: ${link}`,
    `Interest: ${interest}`,
  ];
  if (retainerPlan) lines.push(`Plan: ${retainerPlan}`);
  if (budget) lines.push(`Monthly budget: ${budget}`);
  lines.push('', 'Message:', message || '(none)');

  const subjectBrand = brand.replace(/\s+/g, ' ').slice(0, 80);
  const subject = `Inquiry: ${interest}${retainerPlan ? ` — ${retainerPlan}` : ''} — ${subjectBrand}`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        reply_to: email,
        subject,
        text: lines.join('\n'),
      }),
    });
    if (r.ok) return res.status(200).json({ ok: true });
    const detail = await r.text();
    console.error('inquiry: resend', r.status, detail);
    return fail(res, 502, 'Something went wrong. Try again.');
  } catch (err) {
    console.error('inquiry: request failed', err);
    return fail(res, 500, 'Something went wrong. Try again.');
  }
}
