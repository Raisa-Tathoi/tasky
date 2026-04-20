import { useState } from 'react'
import { fmtTime, PROJECT_COLORS } from '../store'
import Task from './Task'

export default function Project({ pid, project, state, updateState, startTimer, activeTimer, stopTimer }) {
    const [taskInput, setTaskInput] = useState('')
    const color = PROJECT_COLORS[project.colorIndex]

    const suggestions = taskInput.trim()
        ? Object.entries(project.tasks).filter(([, t]) =>
            t.name.toLowerCase().includes(taskInput.toLowerCase())
        )
        : []

    function addOrStartTask() {
        const name = taskInput.trim()
        if (!name) return

        // check for existing task (case-insensitive)
        const existing = Object.entries(project.tasks).find(
            ([, t]) => t.name.toLowerCase() === name.toLowerCase()
        )

        if (existing) {
            setTaskInput('')
            startTimer(pid, existing[0])
            return
        }

        // create new task
        const tid = 't_' + Date.now()
        const newState = {
            ...state,
            projects: {
                ...state.projects,
                [pid]: {
                    ...project,
                    tasks: {
                        ...project.tasks,
                        [tid]: { name, totalTime: 0 }
                    }
                }
            }
        }
        updateState(newState)
        setTaskInput('')
    }

    return (
        <div style={{
            background: '#fff',
            border: '1px solid #faffd2ff',
            borderRadius: 16,
            padding: '1.25rem',
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{project.name}</span>
                </div>
                <span style={{ fontSize: 12, color: '#999' }}>{fmtTime(project.totalTime)} total</span>
            </div>

            {/* task input + suggestions */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        value={taskInput}
                        onChange={e => setTaskInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addOrStartTask()}
                        placeholder="Add or find task..."
                        style={{ width: '100%' }}
                    />
                    {suggestions.length > 0 && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            background: '#f5f5f5', border: '0.5px solid #ddd',
                            borderRadius: 8, zIndex: 10, overflow: 'hidden'
                        }}>
                            {suggestions.map(([tid, t]) => (
                                <div
                                    key={tid}
                                    onClick={() => { setTaskInput(''); startTimer(pid, tid) }}
                                    style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}
                                >
                                    <span>{t.name}</span>
                                    <span style={{ color: '#888' }}>{fmtTime(t.totalTime)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={addOrStartTask}>Add task</button>
            </div>

            {Object.keys(project.tasks).length === 0 && (
                <p style={{ color: '#888', fontSize: 13 }}>No tasks yet.</p>
            )}

            {Object.entries(project.tasks).map(([tid, task]) => (
                <Task
                    key={tid}
                    tid={tid}
                    pid={pid}
                    task={task}
                    state={state}
                    updateState={updateState}
                    startTimer={startTimer}
                    activeTimer={activeTimer}
                    stopTimer={stopTimer}
                />
            ))}
        </div>
    )
}