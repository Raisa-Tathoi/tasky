// The shape of our data:
// {
//   projects: {
//     "p_123": { name: "210", totalTime: 0, colorIndex: 0, tasks: {
//       "t_456": { name: "final prep", totalTime: 0 }
//     }}
//   },
//   sessions: [
//     { date: "2026-04-13", projectId: "p_123", seconds: 600 }
//   ]
// }

const KEY = 'tasktracker_v1'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : { projects: {}, sessions: [] }
  } catch {
    return { projects: {}, sessions: [] }
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function fmtTime(seconds) {
  if (!seconds) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function fmtTimer(seconds) {
  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60
  ].map(v => String(v).padStart(2, '0')).join(':')
}

export const PROJECT_COLORS = [
  '#378ADD', '#1D9E75', '#D85A30', '#D4537E',
  '#7F77DD', '#BA7517', '#639922', '#E24B4A'
]

export function genId() {
  return 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}