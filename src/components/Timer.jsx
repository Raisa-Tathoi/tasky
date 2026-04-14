import { useState, useEffect } from 'react'
import { fmtTimer, PROJECT_COLORS } from '../store'

const [bows, setBows] = useState([])

export default function Timer({ activeTimer, state, stopTimer }) {
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000))
        }, 1000)
        return () => clearInterval(interval)
    }, [activeTimer.startTime])

    useEffect(() => {
        const interval = setInterval(() => {
            const newBow = {
                id: Date.now() + Math.random(),
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                dx: Math.random() * 200 - 100,
                dy: Math.random() * -300 - 100,
                size: Math.random() * 60 + 40,
                duration: Math.random() * 8 + 7,
                delay: 0,
                rotate: Math.random() * 40 - 20,
            }

            setBows(prev => [...prev.slice(-25), newBow]) // keeps max ~25 bows
        }, 800)

        return () => clearInterval(interval)
    }, [])

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
        @keyframes floatAround {
            0% {
                transform: translate(0px, 0px) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 0.8;
            }
            100% {
                transform: translate(var(--dx), var(--dy)) rotate(var(--rot));
                opacity: 0;
            }
        }
      `}</style>

            {bows.map(bow => (
                <img
                    key={bow.id}
                    src="/bow.png"
                    alt=""
                    style={{
                        position: 'absolute',
                        left: bow.left,
                        top: bow.top,
                        width: bow.size,
                        animation: `floatAround ${bow.duration}s linear`,
                        '--rot': `${bow.rotate}deg`,
                        '--dx': `${bow.dx}px`,
                        '--dy': `${bow.dy}px`,
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