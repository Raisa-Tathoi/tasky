import { useState, useEffect } from 'react'
import { fmtTimer, PROJECT_COLORS } from '../store'

const BOWS = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 88 + 2}%`,
  size: Math.random() * 60 + 40,
  duration: Math.random() * 8 + 7,
  delay: Math.random() * 8,
  rotate: Math.random() * 40 - 20,
}))

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
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999,
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.85; }
          90%  { opacity: 0.85; }
          100% { transform: translateY(-15vh) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>

      {BOWS.map(bow => (
        <img
          key={bow.id}
          src="/bow.png"
          alt=""
          style={{
            position: 'absolute',
            left: bow.left,
            bottom: 0,
            width: bow.size,
            animation: `floatUp ${bow.duration}s ${bow.delay}s infinite ease-in-out`,
            '--rot': `${bow.rotate}deg`,
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        />
      ))}

      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '2.5rem 3rem',
        textAlign: 'center',
        minWidth: 280,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>tracking</div>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>{task.name}</div>
        <div style={{ fontSize: 13, color, marginBottom: '1.5rem' }}>{project.name}</div>
        <div style={{ fontSize: 48, fontWeight: 500, letterSpacing: 2, marginBottom: '1.5rem', fontVariantNumeric: 'tabular-nums' }}>
          {fmtTimer(elapsed)}
        </div>
        <button onClick={stopTimer} style={{ color: '#E24B4A', borderColor: '#E24B4A' }}>
          Stop timer
        </button>
      </div>
    </div>
  )
}