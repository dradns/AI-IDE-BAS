#!/usr/bin/env node

import 'dotenv/config'
import fetch from 'node-fetch'

const POSTHOG_HOST = (process.env.POSTHOG_HOST || 'https://app.posthog.com').replace(/\/$/, '')
const API_KEY = process.env.POSTHOG_API_KEY
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID

if (!API_KEY || !PROJECT_ID) {
  console.error('Missing POSTHOG_API_KEY or POSTHOG_PROJECT_ID')
  process.exit(1)
}

// Валидация: для REST API должен быть Personal API Key (phx_...)
if (API_KEY && API_KEY.startsWith('phc_')) {
  console.warn('[PostHog][REST] Обнаружен Project API Key (phc_...). Для REST нужно Personal API Key (phx_...).')
}
if (API_KEY && !API_KEY.startsWith('phx_')) {
  console.warn('[PostHog][REST] Ключ не похож на Personal API Key (phx_...). Проверьте POSTHOG_API_KEY.')
}

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
}

async function api(path, body, method = 'POST') {
  const res = await fetch(`${POSTHOG_HOST}/api/projects/${PROJECT_ID}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${txt}`)
  }
  return res.json()
}

function eventFilter(event) {
  return { event, properties: [] }
}

async function ensureDashboard(name) {
  const dash = await api('/dashboards/', { name, is_shared: false })
  return dash
}

async function createFunnelInsight({ name, steps, windowDays = 14, strict = true }) {
  const filters = {
    insight: 'FUNNELS',
    display: 'FunnelViz',
    date_from: `- ${windowDays}d`,
    funnel_order_type: strict ? 'ordered' : 'unordered',
    breakdown_type: null,
    events: steps.map(s => ({ id: s.event, order: s.order, name: s.event, type: 'events' })),
  }
  return api('/insights/', { name, filters })
}

async function createPathsInsight({ name, dateFrom = '-14d' }) {
  const filters = {
    insight: 'PATHS',
    date_from: dateFrom,
    path_type: 'custom_events',
    include_event_types: ['events'],
    start_point: 'Command Executed',
  }
  return api('/insights/', { name, filters })
}

async function attachToDashboard(dashboardId, insight) {
  return api(`/dashboards/${dashboardId}/tiles/`, { dashboards: [dashboardId], insight: insight.id })
}

async function setup() {
  const dashboard = await ensureDashboard('RooCode Funnels')

  // Macro funnel: Installed -> Activated -> Any command
  const macro = await createFunnelInsight({
    name: 'Macro Funnel: Installed → Activated → Any command',
    steps: [
      { event: 'Extension Installed', order: 0 },
      { event: 'Extension Activated', order: 1 },
      { event: 'Command Executed', order: 2 },
    ],
    windowDays: 14,
    strict: true,
  })
  await attachToDashboard(dashboard.id, macro)

  const macro7 = await createFunnelInsight({
    name: 'Macro Funnel (7d): Installed → Activated → Any command',
    steps: [
      { event: 'Extension Installed', order: 0 },
      { event: 'Extension Activated', order: 1 },
      { event: 'Command Executed', order: 2 },
    ],
    windowDays: 7,
    strict: true,
  })
  await attachToDashboard(dashboard.id, macro7)

  // Micro funnels: Activated -> command_X_executed (top commands can be filtered in UI)
  const micro = await createFunnelInsight({
    name: 'Micro Funnel: Activated → Command Executed',
    steps: [
      { event: 'Extension Activated', order: 0 },
      { event: 'Command Executed', order: 1 },
    ],
    windowDays: 14,
    strict: true,
  })
  await attachToDashboard(dashboard.id, micro)

  const micro7 = await createFunnelInsight({
    name: 'Micro Funnel (7d): Activated → Command Executed',
    steps: [
      { event: 'Extension Activated', order: 0 },
      { event: 'Command Executed', order: 1 },
    ],
    windowDays: 7,
    strict: true,
  })
  await attachToDashboard(dashboard.id, micro7)

  // Paths: Command transitions (matrix derivable from data)
  const paths = await createPathsInsight({ name: 'Feature Transitions: Command → Next Command (14d)' })
  await attachToDashboard(dashboard.id, paths)

  console.log('PostHog funnels created. Dashboard ID:', dashboard.id)
}

async function alert() {
  // Slack удалён. Просто логируем в OutputChannel (stdout)
  const segments = [
    { property: 'platform', value: 'win32' },
    { property: 'platform', value: 'darwin' },
    { property: 'platform', value: 'linux' },
    { property: null, value: null }, // overall
  ]

  const events = {
    installed: 'Extension Installed',
    activated: 'Extension Activated',
    command: 'Command Executed',
  }

  async function trendsCount(event, date_from, breakdownProperty, breakdownValue){
    const filters = {
      insight: 'TRENDS',
      date_from,
      events: [{ id: event, name: event, type: 'events' }],
      display: 'ActionsLineGraph',
      sampling_factor: 1,
    }
    if (breakdownProperty && breakdownValue){
      filters.properties = [{ key: breakdownProperty, type: 'event', value: breakdownValue, operator: 'exact' }]
    }
    const res = await api('/insights/', { name: `count ${event}`, filters })
    try { return res?.result?.[0]?.count || 0 } catch { return 0 }
  }

  function conv(a,b){ return a>0 ? b/a : 0 }
  function pct(x){ return (x*100).toFixed(1)+'%' }

  const lines = []
  for (const seg of segments){
    const segLabel = seg.property ? `${seg.property}=${seg.value}` : 'overall'
    const [i1d,a1d,c1d,i7d,a7d,c7d] = await Promise.all([
      trendsCount(events.installed, '-1d', seg.property, seg.value),
      trendsCount(events.activated, '-1d', seg.property, seg.value),
      trendsCount(events.command, '-1d', seg.property, seg.value),
      trendsCount(events.installed, '-7d', seg.property, seg.value),
      trendsCount(events.activated, '-7d', seg.property, seg.value),
      trendsCount(events.command, '-7d', seg.property, seg.value),
    ])

    const convIA1d = conv(i1d,a1d)
    const convAC1d = conv(a1d,c1d)
    const convIA7d = conv(i7d,a7d)
    const convAC7d = conv(a7d,c7d)

    const dropIA = convIA7d>0 ? (convIA1d-convIA7d)/convIA7d : 0
    const dropAC = convAC7d>0 ? (convAC1d-convAC7d)/convAC7d : 0

    lines.push(`Segment ${segLabel}: I→A 1d=${pct(convIA1d)} vs 7d=${pct(convIA7d)} (Δ=${(dropIA*100).toFixed(1)}%), A→C 1d=${pct(convAC1d)} vs 7d=${pct(convAC7d)} (Δ=${(dropAC*100).toFixed(1)}%)`)

    // Alert thresholds
    // Alerts больше не отправляются в Slack, оставляем как лог
  }

  // Paths anomaly (basic): compare last 1d path counts vs 7d avg via z-score
  async function pathsCounts(date_from){
    const filters = { insight:'PATHS', date_from, path_type:'custom_events', include_event_types:['events'], start_point: events.command }
    const res = await api('/insights/', { name:'paths export', filters })
    // Shape depends on PostHog version; try to map to { path: count }
    const map = new Map()
    try {
      const series = res?.result || []
      for (const row of series){
        const key = row?.name || row?.label || JSON.stringify(row)
        const count = row?.count || row?.value || 0
        map.set(key, (map.get(key)||0) + count)
      }
    } catch {}
    return map
  }

  const last1d = await pathsCounts('-1d')
  const last7d = await pathsCounts('-7d')
  const keys = new Set([...last1d.keys(), ...last7d.keys()])
  const anomalies = []
  for (const k of keys){
    const c1 = last1d.get(k) || 0
    const c7 = last7d.get(k) || 0
    const mu = c7/7
    const sigma = Math.sqrt(mu || 1)
    const z = sigma>0 ? (c1 - mu)/sigma : 0
    if (Math.abs(z) >= 3){
      anomalies.push({ path:k, c1, mu, z })
    }
  }

  if (anomalies.length){
    const top = anomalies.slice(0,5).map(a=>`• ${a.path}: z=${a.z.toFixed(2)} (1d=${a.c1}, μ=${a.mu.toFixed(1)})`).join('\n')
    console.log(`Anomalies (|z|≥3):\n${top}`)
  }

  console.log(['Conversion summary:', ...lines].join('\n'))
}

const cmd = process.argv[2]
if (cmd === 'setup') {
  setup().catch(e => { console.error(e); process.exit(1) })
} else if (cmd === 'alert') {
  alert().catch(e => { console.error(e); process.exit(1) })
} else {
  console.error('Usage: setup-and-alerts.mjs <setup|alert>')
  process.exit(1)
}


