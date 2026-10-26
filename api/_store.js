// Armazenamento dos formulários.
// Produção: Redis REST (Upstash — integração "Upstash for Redis" / Vercel KV).
// Local (sem variáveis de ambiente): arquivo .data/leads.json.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEY = 'alphagold:seletiva';
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const FILE = path.join(process.cwd(), '.data', 'leads.json');

async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error('redis: ' + (json.error || res.status));
  return json.result;
}

function readFile() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return []; }
}

function assertConfigured() {
  if (REDIS_URL && REDIS_TOKEN) return 'redis';
  if (process.env.VERCEL) throw new Error('Armazenamento não configurado (KV_REST_API_URL / KV_REST_API_TOKEN).');
  return 'file';
}

async function addLead(data) {
  const lead = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data };
  if (assertConfigured() === 'redis') {
    await redis(['LPUSH', KEY, JSON.stringify(lead)]);
  } else {
    const all = readFile();
    all.unshift(lead);
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(all, null, 2));
  }
  return lead;
}

async function listLeads() {
  if (assertConfigured() === 'redis') {
    const rows = await redis(['LRANGE', KEY, 0, 4999]);
    return rows.map((r) => JSON.parse(r));
  }
  return readFile();
}

// Compara o token em tempo constante.
function tokenOk(given) {
  const expected = process.env.ADMIN_TOKEN || '';
  if (expected.length < 24 || typeof given !== 'string') return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = { addLead, listLeads, tokenOk };
