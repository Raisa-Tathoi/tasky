import { useState } from 'react'
import { fmtTime, fmtTimer, todayKey, genId } from '../store'

export default function Task({ tid, pid, task, state, updateState, startTimer, activeTimer, stopTimer }) {
    const [showManual, setShowManual] = useState(false)
    const [showEntries, setShowEntries] = useState(false)
    const [manualH, setManualH] = useState('')
    const [manualM, setManualM] = useState('')
    const [manualS, setManualS] = useState('')

    const isRunning = activeTimer?.projectId === pid && activeTimer?.taskId === tid

    const entries = state.sessions.filter(s => s.projectId === pid && s.taskId === tid)

    function addManualTime() {
        const total = (parseInt(manualH) || 0) * 3600
            + (parseInt(manualM) || 0) * 60
            + (parseInt(manualS) || 0)
        if (!total) return

        const newState = {
            ...state,
            projects: {
                ...state.projects,
                [pid]: {
                    ...state.projects[pid],
                    totalTime: state.projects[pid].totalTime + total,
                    tasks: {
                        ...state.projects[pid].tasks,
                        [tid]: { ...task, totalTime: task.totalTime + total }
                    }
                }
            },
            sessions: [
                ...state.sessions,
                { id: genId(), date: todayKey(), projectId: pid, taskId: tid, seconds: total }
            ]
        }

        updateState(newState)
        setManualH(''); setManualM(''); setManualS('')
        setShowManual(false)
    }

    function deleteEntry(entryId) {
        const entry = state.sessions.find(s => s.id === entryId)
        if (!entry) return

        const newState = {
            ...state,
            projects: {
                ...state.projects,
                [pid]: {
                    ...state.projects[pid],
                    totalTime: state.projects[pid].totalTime - entry.seconds,
                    tasks: {
                        ...state.projects[pid].tasks,
                        [tid]: { ...task, totalTime: task.totalTime - entry.seconds }
                    }
                }
            },
            sessions: state.sessions.filter(s => s.id !== entryId)
        }
        updateState(newState)
    }

    return (
        <div style={{ borderTop: '0.5px solid #eee', paddingTop: 8, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 13 }}>{task.name}</span>
                <span style={{ fontSize: 12, color: '#888' }}>{fmtTime(task.totalTime)}</span>

                {entries.length > 0 && (
                    <button
                        onClick={() => setShowEntries(v => !v)}
                        style={{ fontSize: 12, padding: '0 8px', height: 28, color: '#888' }}
                    >
                        {showEntries ? '▲' : '▼'} {entries.length}
                    </button>
                )}

                <button
                    onClick={() => setShowManual(v => !v)}
                    style={{ fontSize: 12, padding: '0 8px', height: 28 }}
                >
                    + time
                </button>

                {isRunning ? (
                    <button onClick={stopTimer} style={{ fontSize: 12, padding: '0 8px', height: 28, color: '#E24B4A' }}>
                        Stop
                    </button>
                ) : (
                    <button
                        onClick={() => startTimer(pid, tid)}
                        disabled={!!activeTimer}
                        style={{ fontSize: 12, padding: '0 8px', height: 28 }}
                    >
                        Start
                    </button>
                )}
            </div>

            {showEntries && (
                <div style={{ marginTop: 8, background: '#f9f9f9', borderRadius: 8, overflow: 'hidden' }}>
                    {entries.map(entry => (
                        <div key={entry.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '6px 10px', borderBottom: '0.5px solid #eee', fontSize: 12
                        }}>
                            <span style={{ color: '#888' }}>{entry.date}</span>
                            <span>{fmtTime(entry.seconds)}</span>
                            <button
                                onClick={() => deleteEntry(entry.id)}
                                style={{ fontSize: 11, height: 22, padding: '0 8px', color: '#E24B4A', borderColor: '#E24B4A' }}
                            >
                                delete
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showManual && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#888' }}>Add:</span>
                    <input type="number" value={manualH} onChange={e => setManualH(e.target.value)}
                        placeholder="0" min="0" style={{ width: 52, height: 28, fontSize: 12, textAlign: 'center' }} />
                    <span style={{ fontSize: 12 }}>h</span>
                    <input type="number" value={manualM} onChange={e => setManualM(e.target.value)}
                        placeholder="0" min="0" max="59" style={{ width: 52, height: 28, fontSize: 12, textAlign: 'center' }} />
                    <span style={{ fontSize: 12 }}>m</span>
                    <input type="number" value={manualS} onChange={e => setManualS(e.target.value)}
                        placeholder="0" min="0" max="59" style={{ width: 52, height: 28, fontSize: 12, textAlign: 'center' }} />
                    <span style={{ fontSize: 12 }}>s</span>
                    <button onClick={addManualTime} style={{ height: 28, fontSize: 12, padding: '0 10px' }}>Add</button>
                    <button onClick={() => setShowManual(false)} style={{ height: 28, fontSize: 12, padding: '0 10px' }}>Cancel</button>
                </div>
            )}
        </div>
    )

    //testing sth
}