import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadToolEnvironment, environmentPort } from './lib/environment.mjs'
const toolEnv = loadToolEnvironment()
const debugPort = environmentPort(toolEnv, 'CHROME_DEBUG_PORT', 9337)
const appPort = environmentPort(toolEnv, 'DEV_PORT', 3100)
const appUrl = toolEnv.APP_URL || `http://${toolEnv.DEV_HOST || '127.0.0.1'}:${appPort}/`
const profile = await mkdtemp(path.join(tmpdir(), 'cc-visual-'))
const benchmarkContacts = toolEnv.CONTACTS_BENCHMARK === '1'
const nativePreview = toolEnv.NATIVE_PREVIEW === '1' || benchmarkContacts
const chrome = spawn(
  toolEnv.CHROME_PATH || 'chrome',
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' },
)
let socket
try {
  let targets
  for (let n = 0; n < 50; n++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()
      break
    } catch {
      await new Promise((r) => setTimeout(r, 100))
    }
  }
  if (!targets) throw new Error('Chrome debugging unavailable')
  socket = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
  })
  let id = 0
  const pending = new Map()
  socket.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id) {
      const p = pending.get(m.id)
      pending.delete(m.id)
      if (m.error) p.reject(m.error)
      else p.resolve(m.result)
    }
  }
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const current = ++id
      pending.set(current, { resolve, reject })
      socket.send(JSON.stringify({ id: current, method, params }))
    })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails))
    return r.result.value
  }
  await send('Page.enable')
  const visualToken = String(Date.now())
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__ccVisualToken = '${visualToken}';`,
  })
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  })
  if (nativePreview) {
    // Test fixture only. This script is never included in Android assets.
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
      const contacts = ${benchmarkContacts ? `Array.from({length:10000}, (_, index) => ({id:'device_' + (index + 1),name:'Pessoa ' + String(index).padStart(5, '0'),number:(index < 5000 ? '0' : '+55') + '219' + String(index % 5000).padStart(8, '0')}))` : '[]'};
      window.__ccRequests = [];
      window.ChamadaCertaNative = { postMessage(raw) {
        const request = JSON.parse(raw);
        window.__ccRequests.push(request.method);
        const status = {contactsPermission:${benchmarkContacts},writeContactsPermission:false,callPermission:true,dialerAvailable:true,dialerHeld:false,notificationsPermission:true,fullScreenAllowed:true,hasActiveCall:false,callLogPermission:false,screeningAvailable:true,screeningHeld:false,blockNonContacts:false,protectionActive:false,screeningError:'',canDial:true,verification:'unavailable'};
        const result = request.method === 'status' ? status : request.method === 'contacts' ? {items:contacts} : request.method === 'dialRequest' ? {id:null,number:null} : {items:[]};
        queueMicrotask(() => this.onmessage?.({data:JSON.stringify({id:request.id,result})}));
      }};
    `,
    })
  }
  await send('Page.navigate', { url: appUrl })
  for (let n = 0; n < 100; n++) {
    if (
      await evaluate(
        `window.__ccVisualToken === '${visualToken}' && !!document.querySelector('.cc-nav')`,
      )
    )
      break
    await new Promise((r) => setTimeout(r, 100))
  }
  if (
    !(await evaluate(
      `window.__ccVisualToken === '${visualToken}' && !!document.querySelector('.cc-nav')`,
    ))
  )
    throw new Error('Application did not finish loading')
  if (nativePreview && !(await evaluate('!!window.ChamadaCertaNative')))
    throw new Error('Native preview was not initialized')
  await mkdir('artifacts/screenshots', { recursive: true })
  const viewports = [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 900, height: 900 },
    { width: 844, height: 390 },
  ]
  for (const { width, height } of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 640,
    })
    for (const [index, name] of ['recentes', 'teclado', 'contatos', 'protecao'].entries()) {
      await evaluate(`document.querySelectorAll('.cc-nav button')[${index}].click()`)
      await evaluate('scrollTo(0,0)')
      await evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))')
      await evaluate('scrollTo(0,0)')
      await evaluate('new Promise(r => requestAnimationFrame(r))')
      const dimensions = await evaluate(
        '({ viewport: innerWidth, content: document.documentElement.scrollWidth })',
      )
      if (dimensions.content > dimensions.viewport)
        throw new Error(`${width} ${name}: overflow ${JSON.stringify(dimensions)}`)
      const topPadding = await evaluate(
        "parseFloat(getComputedStyle(document.querySelector('.cc-header')).paddingTop)",
      )
      if (topPadding < (height < width ? 32 : 44))
        throw new Error(`Insufficient top spacing: ${width}x${height}: ${topPadding}`)
      if (width === 390) {
        const result = await send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: false,
        })
        await writeFile(
          `artifacts/screenshots/${nativePreview ? 'android-preview' : 'mobile-refactor'}-${name}.png`,
          Buffer.from(result.data, 'base64'),
        )
      }
      console.log(`${width}x${height} ${name}: no horizontal overflow, top padding ${topPadding}px`)
    }
  }
  if (benchmarkContacts) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    })
    await send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await evaluate("document.querySelectorAll('.cc-nav button')[2].click()")
    await evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))')
    const rows = await evaluate("document.querySelectorAll('.cc-contact-item').length")
    if (rows !== 50) throw new Error(`Expected 50 rendered contacts, got ${rows}`)
    const requestCount = await evaluate('window.__ccRequests.length')
    const samples = []
    for (let index = 0; index < 20; index++) {
      const query = `Pessoa ${String(4999 - index).padStart(5, '0')}`
      const duration = await evaluate(`(async () => {
        const input = document.querySelector('[aria-label="Buscar por nome ou número"]');
        const started = performance.now();
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(query)});
        input.dispatchEvent(new Event('input', {bubbles:true}));
        for (let frame = 0; frame < 300; frame++) {
          await new Promise(requestAnimationFrame);
          const rows = document.querySelectorAll('.cc-contact-item');
          if (rows.length === 1 && rows[0].querySelector('strong').textContent === ${JSON.stringify(query)}) return performance.now() - started;
        }
        throw new Error('Search did not finish');
      })()`)
      samples.push(duration)
    }
    if ((await evaluate('window.__ccRequests.length')) !== requestCount)
      throw new Error('Search unexpectedly requested native data')
    const ordered = [...samples].sort((a, b) => a - b)
    const report = {
      records: 10000,
      groups: 5000,
      renderedRows: rows,
      cpuThrottle: 4,
      samplesMs: samples,
      medianMs: ordered[10],
      maxMs: ordered.at(-1),
      nativeRequestsDuringSearch: 0,
    }
    await writeFile('artifacts/contacts-performance.json', JSON.stringify(report, null, 2))
    console.log(
      `Contacts benchmark: 10000 records, 5000 groups, 50 rows; CPU 4x; median ${report.medianMs.toFixed(1)} ms, max ${report.maxMs.toFixed(1)} ms; no native requests during search.`,
    )
  }
} finally {
  socket?.close()
  chrome.kill()
}
