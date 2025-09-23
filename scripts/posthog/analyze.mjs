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

function median(arr) {
  const a = [...arr].sort((x,y)=>x-y)
  const n = a.length
  if (n === 0) return 0
  const mid = Math.floor(n/2)
  return n % 2 ? a[mid] : (a[mid-1]+a[mid])/2
}

function mean(arr){
  if(arr.length===0) return 0
  return arr.reduce((s,x)=>s+x,0)/arr.length
}

function std(arr){
  if(arr.length<2) return 0
  const m = mean(arr)
  const v = mean(arr.map(x => (x-m)*(x-m)))
  return Math.sqrt(v)
}

async function fetchEvents(event, date_from='-14d'){
  // Use Insights Trends API with events filter
  const res = await api('/insights/', {
    name: `export ${event}`,
    filters: {
      insight: 'TRENDS',
      date_from,
      events: [{ id: event, name: event, type: 'events' }],
      display: 'ActionsTable',
      breakdown_type: null,
      sampling_factor: 1,
    },
  })
  return res
}

async function main(){
  const installed = 'Extension Installed'
  const activated = 'Extension Activated'
  const command = 'Command Executed'

  // Time-to-next-step: relies on properties captured client-side
  // We’ll query Command Executed with property time_to_command_ms
  // For simplicity, use trends export; for production, switch to query endpoint for raw events

  // Transition matrix approximation using Paths insight data is more accurate; here we outline via count of sequences
  // Placeholder: summarize event counts and basic deltas

  console.log('Computing summary (14d window) ...')
  const [inst, act, cmd] = await Promise.all([
    fetchEvents(installed),
    fetchEvents(activated),
    fetchEvents(command),
  ])

  const safeCount = (ins) => {
    try { return ins?.result?.[0]?.count || 0 } catch { return 0 }
  }

  const installedCount = safeCount(inst)
  const activatedCount = safeCount(act)
  const commandCount = safeCount(cmd)

  console.log(JSON.stringify({ installedCount, activatedCount, commandCount }, null, 2))

  // Hypotheses suggestions
  console.log('\nHypotheses:')
  if (activatedCount && installedCount) {
    const convInstallActivate = activatedCount/Math.max(installedCount,1)
    if (convInstallActivate < 0.3) {
      console.log('- Time-to-Activate likely high → accelerate onboarding (inline tips, auto-open panel).')
    } else {
      console.log('- Activation looks healthy; focus on first feature discovery.')
    }
  }
  if (commandCount && activatedCount) {
    const convActivateCommand = commandCount/Math.max(activatedCount,1)
    if (convActivateCommand < 0.5) {
      console.log('- Low command adoption → surface quick wins (refactor, AI command palette).')
    } else {
      console.log('- Good command adoption; optimize deeper workflows.')
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })


