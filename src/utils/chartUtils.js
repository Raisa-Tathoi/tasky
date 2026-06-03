import { PROJECT_COLORS } from '../store'

export function getToday() {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
}

export function addDays(baseDate, numDays) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + numDays)
    return date
}

export function toDateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function buildSessionsByDate(sessions) {
    const byDate = {}
    for (const session of sessions) {
        if (!byDate[session.date]) byDate[session.date] = {}
        const prev = byDate[session.date][session.projectId] || 0
        byDate[session.date][session.projectId] = prev + session.seconds
    }
    return byDate
}

export function getWeekDays(today, weekOffset) {
    const refDate = addDays(today, weekOffset * 7)
    const dow = refDate.getDay()
    const monday = addDays(refDate, -(dow === 0 ? 6 : dow - 1))
    return Array.from({ length: 7 }, (_, idx) => addDays(monday, idx))
}

export function computeDayData(sessionsByDate, today, dayOffset) {
    const dayDate = addDays(today, dayOffset)
    const dayData = sessionsByDate[toDateKey(dayDate)] || {}
    const dayLabel = getDayLabel(dayOffset, dayDate)
    const daySubtitle = dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    return { dayDate, dayData, dayLabel, daySubtitle }
}

export function computeWeekData(today, weekOffset) {
    const weekDays = getWeekDays(today, weekOffset)
    const weekStart = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const weekEnd = weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const weekLabel = getWeekLabel(weekOffset, weekStart, weekEnd)
    return { weekDays, weekStart, weekEnd, weekLabel }
}

export function getDayLabel(dayOffset, dayDate) {
    if (dayOffset === 0) return 'Today'
    if (dayOffset === -1) return 'Yesterday'
    return dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export function getWeekLabel(weekOffset, weekStart, weekEnd) {
    if (weekOffset === 0) return 'This week'
    if (weekOffset === -1) return 'Last week'
    return `${weekStart} – ${weekEnd}`
}

export function buildDayChartData(projIds, projects, dayData) {
    return {
        labels: projIds.map(pid => projects[pid].name),
        datasets: [
            {
                data: projIds.map(pid => (dayData[pid] || 0) / 3600),
                backgroundColor: projIds.map(pid => PROJECT_COLORS[projects[pid].colorIndex]),
                borderRadius: 4
            }
        ]
    }
}

export function buildWeekChartData(projIds, projects, weekDays, sessionsByDate) {
    return {
        labels: weekDays.map(day => day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })),
        datasets: projIds.map(pid => ({
            label: projects[pid].name,
            data: weekDays.map(day => ((sessionsByDate[toDateKey(day)] || {})[pid] || 0) / 3600),
            backgroundColor: PROJECT_COLORS[projects[pid].colorIndex],
            borderRadius: 2
        }))
    }
}

function formatYAxisTick(value) {
    if (value < 1) return `${Math.round(value * 60)}m`
    return value >= 10 ? `${Math.round(value)}h` : `${Math.round(value * 10) / 10}h`
}

function formatTooltipLabel(ctx) {
    const label = ctx.dataset.label || ctx.label || ''
    const totalMinutes = Math.round(ctx.raw * 60)
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    if (hours > 0 && mins > 0) return `${label}: ${hours}h ${mins}m`
    if (hours > 0) return `${label}: ${hours}h`
    return `${label}: ${mins}m`
}

const BASE_AXIS_OPTIONS = {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: {
        beginAtZero: true,
        ticks: { callback: formatYAxisTick, font: { size: 11 } },
        grid: { color: 'rgba(128,128,128,0.1)' }
    }
}

export function buildChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: formatTooltipLabel } }
        },
        scales: BASE_AXIS_OPTIONS
    }
}

export function buildWeekOptions() {
    return {
        ...buildChartOptions(),
        scales: {
            x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
            y: {
                stacked: true,
                beginAtZero: true,
                ticks: { callback: formatYAxisTick, font: { size: 11 } },
                grid: { color: 'rgba(128,128,128,0.1)' }
            }
        }
    }
}
