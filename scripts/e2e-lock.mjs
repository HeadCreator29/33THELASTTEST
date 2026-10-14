// E2E del bloqueo por código. Uso: (preview en 5199) node scripts/e2e-lock.mjs
import puppeteer from 'puppeteer';
import { homedir } from 'node:os';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

function shellExe() {
  const sys = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (existsSync(sys)) return sys;
  const base = path.join(homedir(), '.cache', 'puppeteer', 'chrome-headless-shell');
  if (!existsSync(base)) return undefined;
  const vers = readdirSync(base).filter((v) => existsSync(path.join(base, v, `chrome-headless-shell-win64`, 'chrome-headless-shell.exe')));
  if (!vers.length) return undefined;
  return path.join(base, vers.sort().pop(), 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
}
const exe = shellExe();
console.log('navegador:', exe ?? '(por defecto de puppeteer)');
const browser = await puppeteer.launch({ headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--no-zygote', '--single-process'],
  ...(exe ? { executablePath: exe } : {}) });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + (e.stack || e.message)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('CONSOLE: ' + m.text());
  });
  const url = process.env.E2E_URL || 'http://localhost:5199/';
  console.log('probando:', url);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('#pin-keys button', { timeout: 10000 });
  const nBtns = await page.$$eval('#pin-keys button', (els) => els.length);
  console.log('botones pin:', nBtns);
  const click3 = () => page.$$eval('#pin-keys button', (els) => {
    const b = els.find((e) => e.textContent === '3');
    if (b) b.click();
    return !!b;
  });
  console.log('click en 3 (1):', await click3());
  await new Promise((r) => setTimeout(r, 300));
  console.log('pin tras un 3:', JSON.stringify(await page.$eval('#pin-display', (el) => el.textContent)));
  console.log('click en 3 (2):', await click3());
  await new Promise((r) => setTimeout(r, 900));
  console.log('home activo:', await page.$eval('#screen-home', (el) => el.classList.contains('active')));
  console.log(errors.length ? 'ERRORES:\n' + errors.join('\n') : 'sin errores de consola');
  if (nBtns !== 12) { console.log('E2E LOCK: FAIL (botones)'); process.exit(1); }
  const homeActive = await page.$eval('#screen-home', (el) => el.classList.contains('active'));
  if (!homeActive || errors.length) { console.log('E2E LOCK: FAIL'); process.exit(1); }
  console.log('E2E LOCK: OK');
} finally {
  await browser.close();
}
