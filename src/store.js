// Data shape:
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

const STORAGE_KEY = 'tasktracker_v1'

export function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : { projects: {}, sessions: [] }
    } catch {
        return { projects: {}, sessions: [] }
    }
}

export function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function todayKey() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function fmtTime(seconds) {
    if (!seconds) return '0s'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${mins}m`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
}

export function fmtTimer(seconds) {
    const parts = [
        Math.floor(seconds / 3600),
        Math.floor((seconds % 3600) / 60),
        seconds % 60
    ]
    return parts.map(part => String(part).padStart(2, '0')).join(':')
}

export const PROJECT_COLORS = [
    '#378ADD', '#1D9E75', '#D85A30', '#D4537E',
    '#7F77DD', '#BA7517', '#639922', '#E24B4A'
]

export function genId() {
    return 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}
