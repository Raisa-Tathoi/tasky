import { useState } from 'react'
import { PROJECT_COLORS, fmtTime } from '../store'
import { getToday, toDateKey } from '../utils/chartUtils'
import {
    getSheetWeekDays, getSheetWeekLabel, getSessionPlacement,
    minutesToPixels, ROW_HEIGHT
} from '../utils/sheetUtils'

const TOTAL_HEIGHT = 48 * ROW_HEIGHT  // 48 half-hour slots = 24 hours

// Hour lines every 64px (dark), half-hour lines every 32px (light)
const GRID_LINES = [
    'repeating-linear-gradient(to bottom, transparent 0px, transparent 63px, #e0e0e0 63px, #e0e0e0 64px)',
    'repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, #f0f0f0 31px, #f0f0f0 32px)'
].join(', ')

function buildDeleteSessionState(state, session) {
    const project = state.projects[session.projectId]
    const task = project?.tasks[session.taskId]
    if (!project || !task) return state
    return {
        ...state,
        projects: {
            ...state.projects,
            [session.projectId]: {
                ...project,
                totalTime: project.totalTime - session.seconds,
                tasks: {
                    ...project.tasks,
                    [session.taskId]: { ...task, totalTime: task.totalTime - session.seconds }
                }
            }
        },
        sessions: state.sessions.filter(ses => ses.id !== session.id)
    }
}

function SessionBlock({ session, project, task, placement, onSelect }) {
    if (!project) return null
    const color = PROJECT_COLORS[project.colorIndex]
    const top = minutesToPixels(placement.startMinutes)
    const height = Math.max(ROW_HEIGHT, minutesToPixels(placement.durationMinutes))
    return (
        <div onClick={() => onSelect(session)} style={{
            position: 'absolute', top, height: height - 1, left: 2, right: 2,
            background: color + '22', borderLeft: `3px solid ${color}`,
            borderRadius: 4, padding: '2px 5px', overflow: 'hidden',
            cursor: 'pointer', zIndex: 1
        }}>
            <div style={{ fontSize: 11, fontWeight: 600, color, lineHeight: 1.3 }}>{project.name}</div>
            {task && height > ROW_HEIGHT && (
                <div style={{ fontSize: 10, color: '#666', lineHeight: 1.2 }}>{task.name}</div>
            )}
        </div>
    )
}

function DayColumn({ day, isToday, daySessions, projects, onSelectSession }) {
    return (
        <div style={{ flex: 1, minWidth: 0, borderLeft: '0.5px solid #eee' }}>
            <div style={{
                height: 40, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', borderBottom: '0.5px solid #eee',
                color: isToday ? '#378ADD' : '#444'
            }}>
                <div style={{ fontSize: 12, fontWeight: isToday ? 600 : 400 }}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div style={{ fontSize: 10, color: isToday ? '#378ADD' : '#bbb' }}>{day.getDate()}</div>
            </div>
            <div style={{ position: 'relative', height: TOTAL_HEIGHT, backgroundImage: GRID_LINES }}>
                {daySessions.map(({ session, placement }) => (
                    <SessionBlock key={session.id} session={session}
                        project={projects[session.projectId]}
                        task={projects[session.projectId]?.tasks[session.taskId]}
                        placement={placement} onSelect={onSelectSession}
                    />
                ))}
            </div>
        </div>
    )
}

function TimeLabels() {
    return (
        <div style={{ width: 44, flexShrink: 0 }}>
            <div style={{ height: 40 }} />
            <div style={{ position: 'relative', height: TOTAL_HEIGHT }}>
                {Array.from({ length: 24 }, (_, hour) => (
                    <div key={hour} style={{
                        position: 'absolute', top: hour * ROW_HEIGHT * 2 - 6,
                        right: 8, fontSize: 10, color: '#bbb', userSelect: 'none'
                    }}>
                        {`${hour}:00`}
                    </div>
                ))}
            </div>
        </div>
    )
}

function SheetGrid({ weekDays, todayDateKey, sessions, projects, onSelectSession }) {
    const sessionsByDay = Array.from({ length: 7 }, () => [])
    for (const session of sessions) {
        const placement = getSessionPlacement(session, weekDays)
        if (placement) sessionsByDay[placement.dayIndex].push({ session, placement })
    }
    return (
        <div style={{ display: 'flex' }}>
            <TimeLabels />
            {weekDays.map((day, idx) => (
                <DayColumn key={toDateKey(day)} day={day}
                    isToday={toDateKey(day) === todayDateKey}
                    daySessions={sessionsByDay[idx]}
                    projects={projects} onSelectSession={onSelectSession}
                />
            ))}
        </div>
    )
}

function SessionPopover({ session, project, task, onClose, onDelete }) {
    const startDate = new Date(session.startTime)
    const startLabel = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#fff', borderRadius: 12, padding: '1.25rem',
                minWidth: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{project?.name}</div>
                {task && <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{task.name}</div>}
                <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                    {session.date} · {startLabel} · {fmtTime(session.seconds)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={onClose} style={{ flex: 1 }}>Close</button>
                    <button onClick={() => onDelete(session)} style={{ flex: 1, color: '#E24B4A', borderColor: '#E24B4A' }}>Delete</button>
                </div>
            </div>
        </div>
    )
}

function SheetNav({ weekOffset, setWeekOffset, weekLabel }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
            <button onClick={() => setWeekOffset(prev => prev - 1)} style={{ width: 28, height: 28, borderRadius: 8, border: '0.5px solid #ccc', background: 'transparent', fontSize: 16 }}>‹</button>
            <span style={{ fontSize: 13, color: '#666', minWidth: 120, textAlign: 'center' }}>{weekLabel}</span>
            <button onClick={() => setWeekOffset(prev => prev + 1)} disabled={weekOffset >= 0}
                style={{ width: 28, height: 28, borderRadius: 8, border: '0.5px solid #ccc', background: 'transparent', fontSize: 16, opacity: weekOffset >= 0 ? 0.3 : 1, cursor: weekOffset >= 0 ? 'not-allowed' : 'pointer' }}>›</button>
        </div>
    )
}

export default function Sheet({ state, updateState }) {
    const [weekOffset, setWeekOffset] = useState(0)
    const [selectedSession, setSelectedSession] = useState(null)

    const today = getToday()
    const weekDays = getSheetWeekDays(today, weekOffset)
    const weekLabel = getSheetWeekLabel(weekOffset, weekDays)
    const placedSessions = state.sessions.filter(session => session.startTime)

    function handleDeleteSession(session) {
        updateState(buildDeleteSessionState(state, session))
        setSelectedSession(null)
    }

    return (
        <div>
            <SheetNav weekOffset={weekOffset} setWeekOffset={setWeekOffset} weekLabel={weekLabel} />
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 160px)', border: '0.5px solid #ddd', borderRadius: 12, overflowX: 'hidden' }}>
                <SheetGrid weekDays={weekDays} todayDateKey={toDateKey(today)}
                    sessions={placedSessions} projects={state.projects} onSelectSession={setSelectedSession} />
            </div>
            {selectedSession && (
                <SessionPopover
                    session={selectedSession}
                    project={state.projects[selectedSession.projectId]}
                    task={state.projects[selectedSession.projectId]?.tasks[selectedSession.taskId]}
                    onClose={() => setSelectedSession(null)}
                    onDelete={handleDeleteSession}
                />
            )}
        </div>
    )
}
