import { useState, useEffect, useRef } from 'react'
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { PROJECT_COLORS } from '../store'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function addDays(date, n) {
    const d = new Date(date)
    d.setDate(d.getDate() + n)
    return d
}

function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Charts({ state }) {
    const [dayOffset, setDayOffset] = useState(0)   // 0 = today, -1 = yesterday
    const [weekOffset, setWeekOffset] = useState(0) // 0 = this week, -1 = last week

    const projIds = Object.keys(state.projects)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // aggregate all sessions by date + project
    const byDate = {}
    for (const s of state.sessions) {
        if (!byDate[s.date]) byDate[s.date] = {}
        byDate[s.date][s.projectId] = (byDate[s.date][s.projectId] || 0) + s.seconds
    }

    // --- day chart ---
    const dayDate = addDays(today, dayOffset)
    const dayData = byDate[dateKey(dayDate)] || {}
    const dayLabel = dayOffset === 0 ? 'Today'
        : dayOffset === -1 ? 'Yesterday'
            : dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    const daySubtitle = dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    const dayChartData = {
        labels: projIds.map(pid => state.projects[pid].name),
        datasets: [{
            data: projIds.map(pid => (dayData[pid] || 0) / 3600),
            backgroundColor: projIds.map(pid => PROJECT_COLORS[state.projects[pid].colorIndex]),
            borderRadius: 4
        }]
    }

    // --- week chart ---
    const refDate = addDays(today, weekOffset * 7)
    const dow = refDate.getDay()
    const monday = addDays(refDate, -(dow === 0 ? 6 : dow - 1))
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
    const dayLabels = weekDays.map(d => d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }))
    const weekStart = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const weekEnd = weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const weekLabel = weekOffset === 0 ? 'This week' : weekOffset === -1 ? 'Last week' : `${weekStart} – ${weekEnd}`

    const weekChartData = {
        labels: dayLabels,
        datasets: projIds.map(pid => ({
            label: state.projects[pid].name,
            data: weekDays.map(d => ((byDate[dateKey(d)] || {})[pid] || 0) / 3600),
            backgroundColor: PROJECT_COLORS[state.projects[pid].colorIndex],
            borderRadius: 2
        }))
    }

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => {
                        const label = ctx.dataset.label || ctx.label || ''
                        const hours = ctx.raw

                        const totalMinutes = Math.round(hours * 60)
                        const h = Math.floor(totalMinutes / 60)
                        const m = totalMinutes % 60

                        if (h > 0 && m > 0) return `${label}: ${h}h ${m}m`
                        if (h > 0) return `${label}: ${h}h`
                        return `${label}: ${m}m`
                    }
                }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: v => {
                        if (v < 1) return `${Math.round(v * 60)}m`
                        return v >= 10
                            ? `${Math.round(v)}h`
                            : `${Math.round(v * 10) / 10}h`
                    },
                    font: { size: 11 }
                },
                grid: { color: 'rgba(128,128,128,0.1)' }
            }
        }
    }

    const weekOptions = {
        ...commonOptions,
        scales: {
            x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
            y: {
                stacked: true,
                beginAtZero: true,
                ticks: {
                    callback: v => {
                        if (v < 1) return `${Math.round(v * 60)}m`
                        return v >= 10
                            ? `${Math.round(v)}h`
                            : `${Math.round(v * 10) / 10}h`
                    },
                    font: { size: 11 }
                },
                grid: { color: 'rgba(128,128,128,0.1)' }
            }
        }
    }

    const legend = projIds.map(pid => (
        <span key={pid} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: PROJECT_COLORS[state.projects[pid].colorIndex], display: 'inline-block' }} />
            {state.projects[pid].name}
        </span>
    ))

    const navBtn = (label, onClick, disabled) => (
        <button onClick={onClick} disabled={disabled} style={{
            width: 28, height: 28, borderRadius: 8, border: '0.5px solid #ccc',
            background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.3 : 1, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>{label}</button>
    )

    return (
        <div>
            {/* day chart */}
            <div style={{ border: '0.5px solid #ddd', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>Daily breakdown</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{daySubtitle}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {navBtn('‹', () => setDayOffset(o => o - 1), dayOffset <= -60)}
                        <span style={{ fontSize: 12, color: '#888', minWidth: 80, textAlign: 'center' }}>{dayLabel}</span>
                        {navBtn('›', () => setDayOffset(o => o + 1), dayOffset >= 0)}
                    </div>
                </div>
                <div style={{
                    height: 220, 
                    background: '#fff',
                    borderRadius: 8,
                    padding: 8
                }}>
                    <Bar key={`day-${dayOffset}`} data={dayChartData} options={commonOptions} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>{legend}</div>
            </div>

            {/* week chart */}
            <div style={{ border: '0.5px solid #ddd', borderRadius: 12, padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>Weekly view</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{weekStart} – {weekEnd}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {navBtn('‹', () => setWeekOffset(o => o - 1), weekOffset <= -12)}
                        <span style={{ fontSize: 12, color: '#888', minWidth: 80, textAlign: 'center' }}>{weekLabel}</span>
                        {navBtn('›', () => setWeekOffset(o => o + 1), weekOffset >= 0)}
                    </div>
                </div>
                <div style={{ 
                    height: 220, 
                    background: '#fff',
                    borderRadius: 8,
                    padding: 8
                 }}>
                    <Bar key={`week-${weekOffset}`} data={weekChartData} options={weekOptions} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>{legend}</div>
            </div>
        </div>
    )
}