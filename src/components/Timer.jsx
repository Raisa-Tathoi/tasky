import { useState, useEffect } from 'react'
import { fmtTimer, PROJECT_COLORS } from '../store'

const RING_SIZE = 280
const STROKE_WIDTH = 14
const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function computeElapsed(activeTimer) {
  const running = activeTimer.runningSince
    ? Math.floor((Date.now() - activeTimer.runningSince) / 1000)
    : 0
  return activeTimer.accumulated + running
}

export default function Timer({ activeTimer, state, stopTimer, pauseTimer, resumeTimer }) {
  const [elapsed, setElapsed] = useState(() => computeElapsed(activeTimer))

  useEffect(() => {
    setElapsed(computeElapsed(activeTimer))
    if (!activeTimer.runningSince) return
    const interval = setInterval(() => setElapsed(computeElapsed(activeTimer)), 250)
    return () => clearInterval(interval)
  }, [activeTimer])

  const project = state.projects[activeTimer.projectId]
  const task = project.tasks[activeTimer.taskId]
  const color = PROJECT_COLORS[project.colorIndex]
  const isPaused = !activeTimer.runningSince

  const completedHours = Math.floor(elapsed / 3600)
  const secondsInMinute = elapsed % 60
  const ringProgress = secondsInMinute / 3600
  const ringOpacity = Math.min(1, 0.2 + completedHours * 0.2)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0, 0, 0, 0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '2.5rem 3rem',
        minWidth: 700,
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
      }}>
        <div style={{ fontStyle: 'italic', color: '#9a9a9a', fontSize: 16, marginBottom: 10 }}>
          Focus Time...
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{task.name}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color, marginBottom: 10 }}>{project.name}</div>

        <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, margin: '0.5rem auto 2.5rem' }}>
          <svg width={RING_SIZE} height={RING_SIZE}>
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={STROKE_WIDTH}
            />
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              fill="none"
              stroke={color}
              strokeOpacity={ringOpacity}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - ringProgress)}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              style={{ transition: 'stroke-dashoffset 0.25s linear, stroke-opacity 0.6s linear' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, fontWeight: 500, letterSpacing: 1, fontVariantNumeric: 'tabular-nums'
          }}>
            {fmtTimer(elapsed)}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
          <button onClick={isPaused ? resumeTimer : pauseTimer}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={stopTimer} style={{ color: '#E24B4A', borderColor: '#E24B4A' }}>
            Stop timer
          </button>
        </div>
      </div>
    </div>
  )
}
