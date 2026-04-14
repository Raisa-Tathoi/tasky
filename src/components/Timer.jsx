import { useState, useEffect } from 'react'
import { fmtTimer, PROJECT_COLORS } from '../store'

export default function Timer({ activeTimer, state, stopTimer }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeTimer.startTime])

  const project = state.projects[activeTimer.projectId]
  const task = project.tasks[activeTimer.taskId]
  const color = PROJECT_COLORS[project.colorIndex]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(255, 207, 244, 0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '10.5rem 15rem',
        textAlign: 'center',
        minWidth: 280
      }}>
        <div style={{ fontSize: 20, color: '#888', marginBottom: 4 }}>Tracking - LOCK IN</div>
        <div style={{ fontSize: 30, fontWeight: 500, marginBottom: 6 }}>{task.name}</div>
        <div style={{ fontSize: 20, color, marginBottom: '1.5rem' }}>{project.name}</div>
        <div style={{ fontSize: 60, fontWeight: 500, letterSpacing: 2, marginBottom: '1.5rem', fontVariantNumeric: 'tabular-nums' }}>
          {fmtTimer(elapsed)}
        </div>
        <button onClick={stopTimer} style={{ color: '#E24B4A', borderColor: '#E24B4A' }}>
          Stop timer
        </button>
      </div>
    </div>
  )
}