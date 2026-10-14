#!/usr/bin/env node
// Upload a zip to the Chrome Web Store and submit it for review (API v2).
// Auth: a service account JSON key in CWS_SERVICE_ACCOUNT_KEY (preferred, doesn't expire),
// or the legacy OAuth client + refresh token (CWS_CLIENT_ID / CWS_CLIENT_SECRET / CWS_REFRESH_TOKEN).
// Usage: node scripts/cws-publish.mjs path/to/extension.zip
import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const SCOPE = 'https://www.googleapis.com/auth/chromewebstore';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API = 'https://chromewebstore.googleapis.com';

const env = (k) => (process.env[k] ?? '').trim();
const fail = (msg) => { console.error(`::error::${msg}`); process.exit(1); };
const b64url = (v) => Buffer.from(v).toString('base64url');

async function tokenRequest(body) {
  const res = await fetch(TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) fail(`Could not get an access token (${res.status}): ${json.error_description || json.error || 'unknown error'}`);
  return json.access_token;
}

/** Service account: sign a JWT with the key and exchange it for an access token (no extra GCP APIs needed). */
async function serviceAccountToken(keyJson) {
  let key;
  try { key = JSON.parse(keyJson); } catch { fail('CWS_SERVICE_ACCOUNT_KEY is not valid JSON (paste the whole key file).'); }
  if (!key.client_email || !key.private_key) fail('CWS_SERVICE_ACCOUNT_KEY is missing client_email or private_key.');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }))}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key.private_key).toString('base64url');
  console.log(`Authenticating as service account ${key.client_email}`);
  return tokenRequest({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` });
}

async function getToken() {
  if (env('CWS_SERVICE_ACCOUNT_KEY')) return serviceAccountToken(env('CWS_SERVICE_ACCOUNT_KEY'));
  if (env('CWS_REFRESH_TOKEN')) {
    console.log('::warning::Using the legacy OAuth refresh token. Switch to CWS_SERVICE_ACCOUNT_KEY (see docs/RELEASING.md).');
    return tokenRequest({ grant_type: 'refresh_token', client_id: env('CWS_CLIENT_ID'), client_secret: env('CWS_CLIENT_SECRET'), refresh_token: env('CWS_REFRESH_TOKEN') });
  }
  fail('No credentials: set the CWS_SERVICE_ACCOUNT_KEY secret.');
}

async function call(token, method, url, body) {
  const res = await fetch(url, { method, headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/zip' } : {}) }, body });
  const text = await res.text();
  let json = {}; try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { ok: res.ok, status: res.status, json, text };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const zip = process.argv[2];
  const extensionId = env('CWS_EXTENSION_ID');
  const publisherId = env('CWS_PUBLISHER_ID');
  if (!zip) fail('Usage: cws-publish.mjs <zip>');
  if (!extensionId || !publisherId) fail('CWS_EXTENSION_ID and CWS_PUBLISHER_ID are required.');
  const item = `publishers/${publisherId}/items/${extensionId}`;
  const token = await getToken();

  // 1. Upload
  console.log(`Uploading ${zip} …`);
  const up = await call(token, 'POST', `${API}/upload/v2/${item}:upload`, await readFile(zip));
  if (!up.ok) fail(`Upload failed (${up.status}): ${up.text}`);
  let state = up.json.uploadState;
  for (let i = 0; state === 'IN_PROGRESS' || state === 'UPLOAD_IN_PROGRESS'; i++) {
    if (i >= 30) fail('Upload still in progress after 5 minutes; check the Developer Dashboard.');
    await sleep(10_000);
    const st = await call(token, 'GET', `${API}/v2/${item}:fetchStatus`);
    if (!st.ok) fail(`fetchStatus failed (${st.status}): ${st.text}`);
    state = st.json.lastAsyncUploadState ?? st.json.uploadState;
  }
  if (state && state !== 'SUCCEEDED') fail(`Upload did not succeed (state ${state}): ${up.text}`);
  console.log('Upload succeeded.');

  // 2. Submit for review
  const pub = await call(token, 'POST', `${API}/v2/${item}:publish`);
  if (pub.ok) { console.log(`Submitted for review: ${pub.json.state ?? 'OK'}`); return; }
  if (/does not meet requirements|not meet the requirements|ITEM_NOT_ELIGIBLE|listing|privacy/i.test(pub.text)) {
    console.log(`::warning::The package was uploaded, but it could not be submitted for review automatically: ${pub.json.error?.message ?? pub.text}`);
    console.log('Open the Chrome Web Store Developer Dashboard, fix what it lists (store listing / privacy tabs), and submit the uploaded draft there.');
    return;
  }
  fail(`Publish failed (${pub.status}): ${pub.text}`);
}

main().catch((e) => fail(e?.stack || String(e)));
