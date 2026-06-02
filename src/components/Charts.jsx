import { useState } from 'react'
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { PROJECT_COLORS } from '../store'
import {
    getToday, buildSessionsByDate, computeDayData, computeWeekData,
    buildDayChartData, buildWeekChartData,
    buildChartOptions, buildWeekOptions
} from '../utils/chartUtils'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function NavButton({ label, onClick, disabled }) {
    return (
        <button onClick={onClick} disabled={disabled} style={{
            width: 28, height: 28, borderRadius: 8, border: '0.5px solid #ccc',
            background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.3 : 1, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>{label}</button>
    )
}

function ProjectLegend({ projIds, projects }) {
    return projIds.map(pid => (
        <span key={pid} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: PROJECT_COLORS[projects[pid].colorIndex], display: 'inline-block' }} />
            {projects[pid].name}
        </span>
    ))
}

function ChartCard({ title, subtitle, navLeft, navLabel, navRight, chartNode, legendNode }) {
    return (
        <div style={{ border: '0.5px solid #ddd', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{title}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{subtitle}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {navLeft}
                    <span style={{ fontSize: 12, color: '#888', minWidth: 80, textAlign: 'center' }}>{navLabel}</span>
                    {navRight}
                </div>
            </div>
            <div style={{ height: 220, background: '#fff', borderRadius: 8, padding: 8 }}>
                {chartNode}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>{legendNode}</div>
        </div>
    )
}

function DayChart({ projIds, projects, sessionsByDate, today, dayOffset, setDayOffset }) {
    const { dayData, dayLabel, daySubtitle } = computeDayData(sessionsByDate, today, dayOffset)
    const chartData = buildDayChartData(projIds, projects, dayData)
    return (
        <ChartCard
            title="Daily breakdown"
            subtitle={daySubtitle}
            navLeft={<NavButton label="‹" onClick={() => setDayOffset(prev => prev - 1)} disabled={dayOffset <= -60} />}
            navLabel={dayLabel}
            navRight={<NavButton label="›" onClick={() => setDayOffset(prev => prev + 1)} disabled={dayOffset >= 0} />}
            chartNode={<Bar key={`day-${dayOffset}`} data={chartData} options={buildChartOptions()} />}
            legendNode={<ProjectLegend projIds={projIds} projects={projects} />}
        />
    )
}

function WeekChart({ projIds, projects, sessionsByDate, today, weekOffset, setWeekOffset }) {
    const { weekDays, weekStart, weekEnd, weekLabel } = computeWeekData(today, weekOffset)
    const chartData = buildWeekChartData(projIds, projects, weekDays, sessionsByDate)
    return (
        <ChartCard
            title="Weekly view"
            subtitle={`${weekStart} – ${weekEnd}`}
            navLeft={<NavButton label="‹" onClick={() => setWeekOffset(prev => prev - 1)} disabled={weekOffset <= -12} />}
            navLabel={weekLabel}
            navRight={<NavButton label="›" onClick={() => setWeekOffset(prev => prev + 1)} disabled={weekOffset >= 0} />}
            chartNode={<Bar key={`week-${weekOffset}`} data={chartData} options={buildWeekOptions()} />}
            legendNode={<ProjectLegend projIds={projIds} projects={projects} />}
        />
    )
}

export default function Charts({ state }) {
    const [dayOffset, setDayOffset] = useState(0)
    const [weekOffset, setWeekOffset] = useState(0)

    const projIds = Object.keys(state.projects)
    const today = getToday()
    const sessionsByDate = buildSessionsByDate(state.sessions)

    return (
        <div>
            <DayChart projIds={projIds} projects={state.projects} sessionsByDate={sessionsByDate}
                today={today} dayOffset={dayOffset} setDayOffset={setDayOffset} />
            <WeekChart projIds={projIds} projects={state.projects} sessionsByDate={sessionsByDate}
                today={today} weekOffset={weekOffset} setWeekOffset={setWeekOffset} />
        </div>
    )
}
