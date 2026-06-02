import { useState } from 'react'
import { fmtTime, PROJECT_COLORS } from '../store'
import Task from './Task'

function getTaskLastWorkedMap(sessions, pid) {
    const map = {}
    for (const session of sessions) {
        if (session.projectId !== pid) continue
        const timestamp = new Date(session.date).getTime()
        map[session.taskId] = Math.max(map[session.taskId] || 0, timestamp)
    }
    return map
}

function filterTaskSuggestions(tasks, input) {
    if (!input.trim()) return []
    return Object.entries(tasks).filter(([, task]) =>
        task.name.toLowerCase().includes(input.toLowerCase())
    )
}

function findExistingTask(tasks, name) {
    return Object.entries(tasks).find(
        ([, task]) => task.name.toLowerCase() === name.toLowerCase()
    )
}

function buildDeleteProjectState(state, pid) {
    const { [pid]: _removed, ...remainingProjects } = state.projects
    return {
        ...state,
        projects: remainingProjects,
        sessions: state.sessions.filter(session => session.projectId !== pid)
    }
}

function buildNewTaskState(state, pid, project, name) {
    const taskId = 't_' + Date.now()
    return {
        ...state,
        projects: {
            ...state.projects,
            [pid]: {
                ...project,
                tasks: {
                    ...project.tasks,
                    [taskId]: { name, totalTime: 0 }
                }
            }
        }
    }
}

function ProjectHeader({ project, color, confirmDelete, onDeleteClick, onConfirmDelete, onCancelDelete }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                <span style={{ fontWeight: 600, fontSize: 16 }}>{project.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#999' }}>{fmtTime(project.totalTime)} total</span>
                {confirmDelete ? (
                    <>
                        <span style={{ fontSize: 12, color: '#E24B4A' }}>Delete project?</span>
                        <button onClick={onConfirmDelete} style={{ fontSize: 12, padding: '0 8px', height: 24, color: '#E24B4A', borderColor: '#E24B4A' }}>Yes</button>
                        <button onClick={onCancelDelete} style={{ fontSize: 12, padding: '0 8px', height: 24 }}>No</button>
                    </>
                ) : (
                    <button onClick={onDeleteClick} style={{ fontSize: 11, padding: '0 6px', height: 24, color: '#ccc', borderColor: '#eee' }}>✕</button>
                )}
            </div>
        </div>
    )
}

function TaskSuggestions({ suggestions, pid, startTimer, setTaskInput }) {
    return (
        <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#f5f5f5', border: '0.5px solid #ddd',
            borderRadius: 8, zIndex: 10, overflow: 'hidden'
        }}>
            {suggestions.map(([tid, task]) => (
                <div
                    key={tid}
                    onClick={() => { setTaskInput(''); startTimer(pid, tid) }}
                    style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}
                >
                    <span>{task.name}</span>
                    <span style={{ color: '#888' }}>{fmtTime(task.totalTime)}</span>
                </div>
            ))}
        </div>
    )
}

function TaskInputRow({ taskInput, setTaskInput, addOrStartTask, suggestions, pid, startTimer }) {
    return (
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
                    <TaskSuggestions suggestions={suggestions} pid={pid} startTimer={startTimer} setTaskInput={setTaskInput} />
                )}
            </div>
            <button onClick={addOrStartTask}>Add task</button>
        </div>
    )
}

export default function Project({ pid, project, state, updateState, startTimer, activeTimer, stopTimer }) {
    const [taskInput, setTaskInput] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(false)
    const color = PROJECT_COLORS[project.colorIndex]
    const suggestions = filterTaskSuggestions(project.tasks, taskInput)
    const taskLastWorked = getTaskLastWorkedMap(state.sessions || [], pid)
    const sortedTasks = Object.entries(project.tasks).sort(
        ([aId], [bId]) => (taskLastWorked[bId] || 0) - (taskLastWorked[aId] || 0)
    )

    function deleteProject() {
        updateState(buildDeleteProjectState(state, pid))
    }

    function addOrStartTask() {
        const name = taskInput.trim()
        if (!name) return
        const existing = findExistingTask(project.tasks, name)
        if (existing) {
            setTaskInput('')
            startTimer(pid, existing[0])
            return
        }
        updateState(buildNewTaskState(state, pid, project, name))
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
            <ProjectHeader
                project={project}
                color={color}
                confirmDelete={confirmDelete}
                onDeleteClick={() => setConfirmDelete(true)}
                onConfirmDelete={deleteProject}
                onCancelDelete={() => setConfirmDelete(false)}
            />
            <TaskInputRow
                taskInput={taskInput}
                setTaskInput={setTaskInput}
                addOrStartTask={addOrStartTask}
                suggestions={suggestions}
                pid={pid}
                startTimer={startTimer}
            />
            {Object.keys(project.tasks).length === 0 && (
                <p style={{ color: '#888', fontSize: 13 }}>No tasks yet.</p>
            )}
            {sortedTasks.map(([tid, task]) => (
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
