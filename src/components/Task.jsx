import { useState } from 'react'
import { fmtTime, genId, todayKey } from '../store'

function buildAddTimeState(state, pid, tid, task, seconds, startTimestamp) {
    return {
        ...state,
        projects: {
            ...state.projects,
            [pid]: {
                ...state.projects[pid],
                totalTime: state.projects[pid].totalTime + seconds,
                tasks: {
                    ...state.projects[pid].tasks,
                    [tid]: { ...task, totalTime: task.totalTime + seconds }
                }
            }
        },
        sessions: [
            ...state.sessions,
            { id: genId(), date: todayKey(), projectId: pid, taskId: tid, seconds, startTime: startTimestamp }
        ]
    }
}

function buildDeleteEntryState(state, pid, tid, task, entry) {
    return {
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
        sessions: state.sessions.filter(session => session.id !== entry.id)
    }
}

function TaskControls({
    task, entries, isRunning, activeTimer, pid, tid,
    startTimer, stopTimer, showEntries, setShowEntries, setShowManual
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, fontSize: 13 }}>{task.name}</span>
            <span style={{ fontSize: 12, color: '#888' }}>{fmtTime(task.totalTime)}</span>
            {entries.length > 0 && (
                <button
                    onClick={() => setShowEntries(prev => !prev)}
                    style={{ fontSize: 12, padding: '0 8px', height: 28, color: '#888' }}
                >
                    {showEntries ? '▲' : '▼'} {entries.length}
                </button>
            )}
            <button onClick={() => setShowManual(prev => !prev)} style={{ fontSize: 12, padding: '0 8px', height: 28 }}>
                + time
            </button>
            {isRunning ? (
                <button onClick={stopTimer} style={{ fontSize: 12, padding: '0 8px', height: 28, color: '#E24B4A' }}>Stop</button>
            ) : (
                <button
                    onClick={() => startTimer(pid, tid)}
                    disabled={!!activeTimer}
                    className={!activeTimer ? 'btn-primary' : undefined}
                    style={{ fontSize: 12, padding: '0 8px', height: 28 }}
                >Start</button>
            )}
        </div>
    )
}

function EntryList({ entries, onDelete }) {
    return (
        <div style={{ marginTop: 8, background: '#f9f9f9', borderRadius: 8, overflow: 'hidden' }}>
            {entries.map(entry => (
                <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderBottom: '0.5px solid #eee', fontSize: 12
                }}>
                    <span style={{ color: '#888' }}>{entry.date}</span>
                    <span style={{ color: '#888' }}>
                        {entry.startTime
                            ? new Date(entry.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                    </span>
                    <span>{fmtTime(entry.seconds)}</span>
                    <button
                        onClick={() => onDelete(entry.id)}
                        style={{ fontSize: 11, height: 22, padding: '0 8px', color: '#E24B4A', borderColor: '#E24B4A' }}
                    >
                        delete
                    </button>
                </div>
            ))}
        </div>
    )
}

function currentTimeString() {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function DurationInputs({ hrs, setHrs, mins, setMins, secs, setSecs }) {
    return (
        <>
            <span style={{ fontSize: 12, color: '#888' }}>Duration:</span>
            <input type="number" value={hrs} onChange={e => setHrs(e.target.value)}
                placeholder="0" min="0" style={{ width: 52, height: 28, fontSize: 12, textAlign: 'center' }} />
            <span style={{ fontSize: 12 }}>h</span>
            <input type="number" value={mins} onChange={e => setMins(e.target.value)}
                placeholder="0" min="0" max="59" style={{ width: 52, height: 28, fontSize: 12, textAlign: 'center' }} />
            <span style={{ fontSize: 12 }}>m</span>
            <input type="number" value={secs} onChange={e => setSecs(e.target.value)}
                placeholder="0" min="0" max="59" style={{ width: 52, height: 28, fontSize: 12, textAlign: 'center' }} />
            <span style={{ fontSize: 12 }}>s</span>
        </>
    )
}

function ManualTimeForm({ onAdd, onCancel }) {
    const [hrs, setHrs] = useState('')
    const [mins, setMins] = useState('')
    const [secs, setSecs] = useState('')
    const [startTime, setStartTime] = useState(currentTimeString)

    function handleAdd() {
        const total = (parseInt(hrs) || 0) * 3600 + (parseInt(mins) || 0) * 60 + (parseInt(secs) || 0)
        if (!total) return
        const [startHour, startMin] = startTime.split(':').map(Number)
        const startDate = new Date()
        startDate.setHours(startHour, startMin, 0, 0)
        onAdd(total, startDate.getTime())
        setHrs('')
        setMins('')
        setSecs('')
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#888' }}>Start:</span>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                style={{ height: 28, fontSize: 12, width: 90 }} />
            <DurationInputs
                hrs={hrs} setHrs={setHrs}
                mins={mins} setMins={setMins}
                secs={secs} setSecs={setSecs}
            />
            <button onClick={handleAdd} style={{ height: 28, fontSize: 12, padding: '0 10px' }}>Add</button>
            <button onClick={onCancel} style={{ height: 28, fontSize: 12, padding: '0 10px' }}>Cancel</button>
        </div>
    )
}

export default function Task({ tid, pid, task, state, updateState, startTimer, activeTimer, stopTimer }) {
    const [showManual, setShowManual] = useState(false)
    const [showEntries, setShowEntries] = useState(false)

    const isRunning = activeTimer?.projectId === pid && activeTimer?.taskId === tid
    const entries = state.sessions.filter(session => session.projectId === pid && session.taskId === tid)

    function addManualTime(totalSeconds, startTimestamp) {
        if (!totalSeconds) return
        updateState(buildAddTimeState(state, pid, tid, task, totalSeconds, startTimestamp))
    }

    function deleteEntry(entryId) {
        const entry = state.sessions.find(session => session.id === entryId)
        if (!entry) return
        updateState(buildDeleteEntryState(state, pid, tid, task, entry))
    }

    return (
        <div style={{ borderTop: '0.5px solid #eee', paddingTop: 8, marginTop: 8 }}>
            <TaskControls
                task={task} entries={entries} isRunning={isRunning} activeTimer={activeTimer}
                pid={pid} tid={tid} startTimer={startTimer} stopTimer={stopTimer}
                showEntries={showEntries}
                setShowEntries={setShowEntries} setShowManual={setShowManual}
            />
            {showEntries && <EntryList entries={entries} onDelete={deleteEntry} />}
            {showManual && <ManualTimeForm onAdd={addManualTime} onCancel={() => setShowManual(false)} />}
        </div>
    )
}
