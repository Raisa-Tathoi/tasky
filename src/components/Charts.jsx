import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { PROJECT_COLORS } from '../store'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function Charts({ state }) {
  const projIds = Object.keys(state.projects)

  // build daily aggregates from sessions
  const dailyData = {}
  for (const s of state.sessions) {
    if (!dailyData[s.date]) dailyData[s.date] = {}
    dailyData[s.date][s.projectId] = (dailyData[s.date][s.projectId] || 0) + s.seconds
  }

  // last 7 days
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  const dayLabels = days.map(d =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  )

  const today = new Date().toISOString().slice(0, 10)
  const todayData = dailyData[today] || {}

  const todayChartData = {
    labels: projIds.map(pid => state.projects[pid].name),
    datasets: [{
      data: projIds.map(pid => Math.round((todayData[pid] || 0) / 60)),
      backgroundColor: projIds.map(pid => PROJECT_COLORS[state.projects[pid].colorIndex]),
      borderRadius: 4
    }]
  }

  const weekChartData = {
    labels: dayLabels,
    datasets: projIds.map(pid => ({
      label: state.projects[pid].name,
      data: days.map(d => Math.round(((dailyData[d] || {})[pid] || 0) / 60)),
      backgroundColor: PROJECT_COLORS[state.projects[pid].colorIndex],
      borderRadius: 2
    }))
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { callback: v => v + 'm' } }
    }
  }

  const weekOptions = {
    ...commonOptions,
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, ticks: { callback: v => v + 'm' } }
    }
  }

  // legend
  const legend = projIds.map(pid => (
    <span key={pid} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888' }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: PROJECT_COLORS[state.projects[pid].colorIndex], display: 'inline-block' }} />
      {state.projects[pid].name}
    </span>
  ))

  return (
    <div>
      <div style={{ border: '0.5px solid #ddd', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 12 }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>Today's breakdown</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Minutes per project today</div>
        <div style={{ height: 240 }}>
          <Bar data={todayChartData} options={commonOptions} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>{legend}</div>
      </div>

      <div style={{ border: '0.5px solid #ddd', borderRadius: 12, padding: '1rem 1.25rem' }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>This week</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Daily totals, coloured by project</div>
        <div style={{ height: 280 }}>
          <Bar data={weekChartData} options={weekOptions} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>{legend}</div>
      </div>
    </div>
  )
}