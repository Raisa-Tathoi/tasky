import { useState, useEffect, useRef } from 'react'
import { PROJECT_COLORS, fmtTime } from '../store'
import { getToday, toDateKey } from '../utils/chartUtils'
import {
    getSheetWeekDays, getSheetWeekLabel, getSessionPlacement,
    minutesToPixels, ROW_HEIGHT
} from '../utils/sheetUtils'

const TOTAL_HEIGHT = 48 * ROW_HEIGHT
const TIME_LABEL_WIDTH = 44
const DRAG_THRESHOLD_PX = 4
const SNAP_PX = ROW_HEIGHT / 2  // 15-minute snap

const GRID_LINES = [
    'repeating-linear-gradient(to bottom, transparent 0px, transparent 63px, #e0e0e0 63px, #e0e0e0 64px)',
    'repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, #f0f0f0 31px, #f0f0f0 32px)'
].join(', ')

// ─── State helpers ────────────────────────────────────────────────────────────

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
                tasks: { ...project.tasks, [session.taskId]: { ...task, totalTime: task.totalTime - session.seconds } }
            }
        },
        sessions: state.sessions.filter(ses => ses.id !== session.id)
    }
}

function buildDragUpdateState(state, session, newStartTime, newDate, newSeconds, timeDiff) {
    const project = state.projects[session.projectId]
    const task = project?.tasks[session.taskId]
    if (!project || !task) return state
    return {
        ...state,
        projects: {
            ...state.projects,
            [session.projectId]: {
                ...project,
                totalTime: project.totalTime + timeDiff,
                tasks: { ...project.tasks, [session.taskId]: { ...task, totalTime: task.totalTime + timeDiff } }
            }
        },
        sessions: state.sessions.map(ses =>
            ses.id === session.id ? { ...ses, startTime: newStartTime, date: newDate, seconds: newSeconds } : ses
        )
    }
}

// ─── Drag computation ─────────────────────────────────────────────────────────

function snapPx(px) {
    return Math.round(px / SNAP_PX) * SNAP_PX
}

function applyMoveDrag(drag, mouseEvent, gridEl) {
    const topPx = Math.max(0, Math.min(TOTAL_HEIGHT - ROW_HEIGHT, snapPx(drag.startTopPx + mouseEvent.clientY - drag.startMouseY)))
    let dayIndex = drag.startDayIndex
    if (gridEl) {
        const rect = gridEl.getBoundingClientRect()
        const relX = mouseEvent.clientX - rect.left - TIME_LABEL_WIDTH
        dayIndex = Math.max(0, Math.min(6, Math.floor(relX / ((rect.width - TIME_LABEL_WIDTH) / 7))))
    }
    return { topPx, heightPx: drag.startHeightPx, dayIndex }
}

function applyResizeTopDrag(drag, mouseEvent) {
    const topPx = Math.max(0, Math.min(drag.startTopPx + drag.startHeightPx - ROW_HEIGHT, snapPx(drag.startTopPx + mouseEvent.clientY - drag.startMouseY)))
    return { topPx, heightPx: drag.startTopPx + drag.startHeightPx - topPx, dayIndex: drag.startDayIndex }
}

function applyResizeBottomDrag(drag, mouseEvent) {
    const heightPx = Math.min(TOTAL_HEIGHT - drag.startTopPx, Math.max(ROW_HEIGHT, snapPx(drag.startHeightPx + mouseEvent.clientY - drag.startMouseY)))
    return { topPx: drag.startTopPx, heightPx, dayIndex: drag.startDayIndex }
}

function applyDrag(drag, mouseEvent, gridEl) {
    if (drag.dragType === 'move') return applyMoveDrag(drag, mouseEvent, gridEl)
    if (drag.dragType === 'resize-top') return applyResizeTopDrag(drag, mouseEvent)
    return applyResizeBottomDrag(drag, mouseEvent)
}

function commitDrag(state, weekDays, updateState, drag) {
    const { session, preview } = drag
    const startMinutes = Math.round((preview.topPx / ROW_HEIGHT) * 30)
    const newSeconds = Math.max(60, Math.round((preview.heightPx / ROW_HEIGHT) * 30) * 60)
    const dayDate = weekDays[preview.dayIndex]
    const startDate = new Date(dayDate.getTime())
    startDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0)
    updateState(buildDragUpdateState(state, session, startDate.getTime(), toDateKey(dayDate), newSeconds, newSeconds - session.seconds))
}

// ─── Drag hook ────────────────────────────────────────────────────────────────

function useDragSessions(stateRef, weekDaysRef, updateStateRef, gridRef, onClickSession) {
    const dragRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragPreview, setDragPreview] = useState(null)

    function startDrag(e, session, dragType) {
        e.preventDefault()
        const placement = getSessionPlacement(session, weekDaysRef.current)
        if (!placement) return
        const topPx = minutesToPixels(placement.startMinutes)
        const heightPx = Math.max(ROW_HEIGHT, minutesToPixels(placement.durationMinutes))
        dragRef.current = {
            session, dragType, hasDragged: false, preview: null,
            startMouseY: e.clientY, startMouseX: e.clientX,
            startTopPx: topPx, startHeightPx: heightPx, startDayIndex: placement.dayIndex
        }
        setDragPreview({ sessionId: session.id, session, topPx, heightPx, dayIndex: placement.dayIndex })
        setIsDragging(true)
    }

    useEffect(() => {
        if (!isDragging) return

        function onMove(e) {
            const drag = dragRef.current
            if (!drag) return
            const moved = Math.abs(e.clientY - drag.startMouseY) + Math.abs(e.clientX - drag.startMouseX)
            if (moved > DRAG_THRESHOLD_PX) drag.hasDragged = true
            const placement = applyDrag(drag, e, gridRef.current)
            drag.preview = placement
            setDragPreview(prev => prev ? { ...prev, ...placement } : null)
        }

        function onUp() {
            const drag = dragRef.current
            dragRef.current = null
            setDragPreview(null)
            setIsDragging(false)
            if (!drag) return
            if (!drag.hasDragged) onClickSession(drag.session)
            else if (drag.preview) commitDrag(stateRef.current, weekDaysRef.current, updateStateRef.current, drag)
        }

        document.body.style.cursor = dragRef.current?.dragType === 'move' ? 'grabbing' : 'ns-resize'
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
        return () => {
            document.body.style.cursor = ''
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
    }, [isDragging])

    return { dragPreview, startDrag }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DragPreviewBlock({ project, topPx, heightPx }) {
    if (!project) return null
    const color = PROJECT_COLORS[project.colorIndex]
    return (
        <div style={{
            position: 'absolute', top: topPx, height: heightPx - 1, left: 2, right: 2,
            background: color + '44', borderLeft: `3px solid ${color}`,
            borderRadius: 4, padding: '2px 5px', pointerEvents: 'none', zIndex: 2
        }}>
            <div style={{ fontSize: 11, fontWeight: 600, color }}>{project.name}</div>
        </div>
    )
}

function SessionBlock({ session, project, task, placement, isDragging, onStartDrag }) {
    if (!project) return null
    const color = PROJECT_COLORS[project.colorIndex]
    const top = minutesToPixels(placement.startMinutes)
    const height = Math.max(ROW_HEIGHT, minutesToPixels(placement.durationMinutes))
    return (
        <div style={{
            position: 'absolute', top, height: height - 1, left: 2, right: 2,
            background: color + '22', borderLeft: `3px solid ${color}`,
            borderRadius: 4, overflow: 'hidden', userSelect: 'none',
            opacity: isDragging ? 0.25 : 1
        }}>
            <div onMouseDown={e => onStartDrag(e, session, 'resize-top')}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize', zIndex: 2 }} />
            <div onMouseDown={e => onStartDrag(e, session, 'move')}
                style={{ padding: '2px 5px', cursor: 'grab', height: '100%' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color, lineHeight: 1.3 }}>{project.name}</div>
                {task && height > ROW_HEIGHT && (
                    <div style={{ fontSize: 10, color: '#666', lineHeight: 1.2 }}>{task.name}</div>
                )}
            </div>
            <div onMouseDown={e => onStartDrag(e, session, 'resize-bottom')}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize', zIndex: 2 }} />
        </div>
    )
}

function DayColumn({ day, dayIndex, isToday, daySessions, projects, dragPreview, onStartDrag }) {
    const isPreviewHere = dragPreview?.dayIndex === dayIndex
    return (
        <div style={{ flex: 1, minWidth: 0, borderLeft: '0.5px solid #eee' }}>
            <div style={{
                height: 40, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', borderBottom: '0.5px solid #eee', color: isToday ? '#378ADD' : '#444'
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
                        placement={placement}
                        isDragging={dragPreview?.sessionId === session.id}
                        onStartDrag={onStartDrag}
                    />
                ))}
                {isPreviewHere && dragPreview.session && (
                    <DragPreviewBlock project={projects[dragPreview.session.projectId]}
                        topPx={dragPreview.topPx} heightPx={dragPreview.heightPx} />
                )}
            </div>
        </div>
    )
}

function TimeLabels() {
    return (
        <div style={{ width: TIME_LABEL_WIDTH, flexShrink: 0 }}>
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

function SheetGrid({ weekDays, todayDateKey, sessions, projects, dragPreview, onStartDrag, gridRef }) {
    const sessionsByDay = Array.from({ length: 7 }, () => [])
    for (const session of sessions) {
        const placement = getSessionPlacement(session, weekDays)
        if (placement) sessionsByDay[placement.dayIndex].push({ session, placement })
    }
    return (
        <div ref={gridRef} style={{ display: 'flex' }}>
            <TimeLabels />
            {weekDays.map((day, idx) => (
                <DayColumn key={toDateKey(day)} day={day} dayIndex={idx}
                    isToday={toDateKey(day) === todayDateKey}
                    daySessions={sessionsByDay[idx]}
                    projects={projects} dragPreview={dragPreview} onStartDrag={onStartDrag}
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function Sheet({ state, updateState }) {
    const [weekOffset, setWeekOffset] = useState(0)
    const [selectedSession, setSelectedSession] = useState(null)

    const today = getToday()
    const weekDays = getSheetWeekDays(today, weekOffset)
    const weekLabel = getSheetWeekLabel(weekOffset, weekDays)
    const placedSessions = state.sessions.filter(session => session.startTime)

    const gridRef = useRef(null)
    const stateRef = useRef(state)
    stateRef.current = state
    const weekDaysRef = useRef(weekDays)
    weekDaysRef.current = weekDays
    const updateStateRef = useRef(updateState)
    updateStateRef.current = updateState

    const { dragPreview, startDrag } = useDragSessions(stateRef, weekDaysRef, updateStateRef, gridRef, setSelectedSession)

    function handleDeleteSession(session) {
        updateState(buildDeleteSessionState(state, session))
        setSelectedSession(null)
    }

    return (
        <div>
            <SheetNav weekOffset={weekOffset} setWeekOffset={setWeekOffset} weekLabel={weekLabel} />
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 160px)', border: '0.5px solid #ddd', borderRadius: 12, overflowX: 'hidden', background: '#fff' }}>
                <SheetGrid weekDays={weekDays} todayDateKey={toDateKey(today)}
                    sessions={placedSessions} projects={state.projects}
                    dragPreview={dragPreview} onStartDrag={startDrag} gridRef={gridRef} />
            </div>
            {selectedSession && (
                <SessionPopover session={selectedSession}
                    project={state.projects[selectedSession.projectId]}
                    task={state.projects[selectedSession.projectId]?.tasks[selectedSession.taskId]}
                    onClose={() => setSelectedSession(null)} onDelete={handleDeleteSession} />
            )}
        </div>
    )
}
