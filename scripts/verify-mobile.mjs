import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const profile = await mkdtemp(path.join(tmpdir(), 'cc-visual-'));
const chrome = spawn(
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9337',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' },
);
let socket;
try {
  let targets;
  for (let n = 0; n < 50; n++) {
    try {
      targets = await (await fetch('http://127.0.0.1:9337/json')).json();
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  if (!targets) throw new Error('Chrome debugging unavailable');
  socket = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  socket.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) p.reject(m.error);
      else p.resolve(m.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const current = ++id;
      pending.set(current, { resolve, reject });
      socket.send(JSON.stringify({ id: current, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  await send('Page.enable');
  const visualToken = String(Date.now());
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__ccVisualToken = '${visualToken}';`,
  });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  if (process.env.NATIVE_PREVIEW === '1') {
    // Test fixture only. This script is never included in Android assets.
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
      window.ChamadaCertaNative = { postMessage(raw) {
        const request = JSON.parse(raw);
        const status = {contactsPermission:false,writeContactsPermission:false,callPermission:true,dialerAvailable:true,dialerHeld:false,notificationsPermission:true,fullScreenAllowed:true,hasActiveCall:false,callLogPermission:false,screeningAvailable:true,screeningHeld:false,blockNonContacts:false,protectionActive:false,screeningError:'',canDial:true,verification:'unavailable'};
        queueMicrotask(() => this.onmessage?.({data:JSON.stringify({id:request.id,result:request.method === 'status' ? status : {items:[]}})}));
      }};
    `,
    });
  }
  await send('Page.navigate', { url: process.env.APP_URL || 'http://127.0.0.1:3100/' });
  for (let n = 0; n < 100; n++) {
    if (
      await evaluate(
        `window.__ccVisualToken === '${visualToken}' && !!document.querySelector('.cc-nav')`,
      )
    )
      break;
    await new Promise((r) => setTimeout(r, 100));
  }
  if (
    !(await evaluate(
      `window.__ccVisualToken === '${visualToken}' && !!document.querySelector('.cc-nav')`,
    ))
  )
    throw new Error('Application did not finish loading');
  if (process.env.NATIVE_PREVIEW === '1' && !(await evaluate('!!window.ChamadaCertaNative')))
    throw new Error('Native preview was not initialized');
  await mkdir('artifacts/screenshots', { recursive: true });
  const viewports = [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 900, height: 900 },
    { width: 844, height: 390 },
  ];
  for (const { width, height } of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 640,
    });
    for (const [index, name] of ['recentes', 'teclado', 'contatos', 'protecao'].entries()) {
      await evaluate(`document.querySelectorAll('.cc-nav button')[${index}].click()`);
      await evaluate('scrollTo(0,0)');
      await evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
      await evaluate('scrollTo(0,0)');
      await evaluate('new Promise(r => requestAnimationFrame(r))');
      const dimensions = await evaluate(
        '({ viewport: innerWidth, content: document.documentElement.scrollWidth })',
      );
      if (dimensions.content > dimensions.viewport)
        throw new Error(`${width} ${name}: overflow ${JSON.stringify(dimensions)}`);
      const topPadding = await evaluate(
        "parseFloat(getComputedStyle(document.querySelector('.cc-header')).paddingTop)",
      );
      if (topPadding < (height < width ? 32 : 44))
        throw new Error(`Insufficient top spacing: ${width}x${height}: ${topPadding}`);
      if (width === 390) {
        const result = await send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: false,
        });
        await writeFile(
          `artifacts/screenshots/${process.env.NATIVE_PREVIEW === '1' ? 'android-preview' : 'mobile-refactor'}-${name}.png`,
          Buffer.from(result.data, 'base64'),
        );
      }
      console.log(
        `${width}x${height} ${name}: no horizontal overflow, top padding ${topPadding}px`,
      );
    }
  }
} finally {
  socket?.close();
  chrome.kill();
}
