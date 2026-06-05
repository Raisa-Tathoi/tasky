import { useState } from 'react'
import { fmtTime, PROJECT_COLORS } from '../store'
import Task from './Task'

const CARD_STYLE = {
    background: '#fff', border: '1px solid #e8e8e4',
    borderRadius: 16, padding: '1.25rem',
    marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
}

const SECTION_HEADER_BTN = {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0 4px',
    background: 'none', border: 'none', cursor: 'pointer', width: '100%',
    color: '#888', textAlign: 'left'
}

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
                    [taskId]: { name, totalTime: 0, status: 'active', dueDate: null }
                }
            }
        }
    }
}

function sortTasksByLastWorked(tasks, sessions, pid) {
    const lastWorked = getTaskLastWorkedMap(sessions || [], pid)
    return Object.entries(tasks).sort(
        ([aId], [bId]) => (lastWorked[bId] || 0) - (lastWorked[aId] || 0)
    )
}

function splitTasksByStatus(sortedTasks) {
    const active = sortedTasks.filter(([, task]) => !task.status || task.status === 'active')
    const done = sortedTasks.filter(([, task]) => task.status === 'done')
    return { active, done }
}

function makeAddOrStartTask({ project, pid, state, updateState, startTimer, taskInput, setTaskInput }) {
    return () => {
        const name = taskInput.trim()
        if (!name) return
        const existing = findExistingTask(project.tasks, name)
        if (existing) { setTaskInput(''); startTimer(pid, existing[0]); return }
        updateState(buildNewTaskState(state, pid, project, name))
        setTaskInput('')
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
                    <button onClick={onDeleteClick} style={{ fontSize: 11, padding: '0 6px', height: 34, color: '#876565ff', borderColor: '#fbdcdcff' }}>
                        <img src="/images/delete-icon.png" alt="Delete" width="15" height="15" /></button>
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
            <button onClick={addOrStartTask} className="btn-primary">Add task</button>
        </div>
    )
}

function TaskSection({ title, count, expanded, onToggle, isEmpty, emptyText, children }) {
    const arrow = expanded ?
        <img src="/images/up-icon.png" alt="Up" width="15" height="10" /> :
        <img src="/images/dropdown-icon.png" alt="Dropdown" width="15" height="10" />
    return (
        <div style={{ marginTop: 4 }}>
            <button onClick={onToggle} style={SECTION_HEADER_BTN}>
                <span style={{ fontSize: 10 }}>{arrow}</span>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {title}
                </span>
                <span style={{ fontSize: 11, color: '#bbb' }}>{count}</span>
            </button>
            {expanded && isEmpty && (
                <p style={{ color: '#bbb', fontSize: 12, padding: '4px 0 0 18px' }}>{emptyText}</p>
            )}
            {expanded && !isEmpty && children}
        </div>
    )
}

function TaskBucket({ title, tasks, expanded, onToggle, taskProps }) {
    return (
        <TaskSection title={title} count={tasks.length} expanded={expanded} onToggle={onToggle}
            isEmpty={tasks.length === 0} emptyText={`No ${title.toLowerCase()}`}>
            {tasks.map(([tid, task]) => (
                <Task key={tid} tid={tid} task={task} {...taskProps} />
            ))}
        </TaskSection>
    )
}

function ProjectTaskList({ project, pid, state, updateState, startTimer, activeTimer, stopTimer }) {
    const [activeOpen, setActiveOpen] = useState(true)
    const [oldOpen, setOldOpen] = useState(false)

    if (Object.keys(project.tasks).length === 0) {
        return <p style={{ color: '#888', fontSize: 13 }}>No tasks yet.</p>
    }

    const sortedTasks = sortTasksByLastWorked(project.tasks, state.sessions, pid)
    const { active, done } = splitTasksByStatus(sortedTasks)
    const taskProps = { pid, state, updateState, startTimer, activeTimer, stopTimer }

    return (
        <>
            <TaskBucket title="Active Tasks" tasks={active} expanded={activeOpen}
                onToggle={() => setActiveOpen(!activeOpen)} taskProps={taskProps} />
            {done.length > 0 && (
                <TaskBucket title="Old Tasks" tasks={done} expanded={oldOpen}
                    onToggle={() => setOldOpen(!oldOpen)} taskProps={taskProps} />
            )}
        </>
    )
}

export default function Project({ pid, project, state, updateState, startTimer, activeTimer, stopTimer }) {
    const [taskInput, setTaskInput] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(false)
    const color = PROJECT_COLORS[project.colorIndex]
    const suggestions = filterTaskSuggestions(project.tasks, taskInput)
    const deleteProject = () => updateState(buildDeleteProjectState(state, pid))
    const addOrStartTask = makeAddOrStartTask({
        project, pid, state, updateState, startTimer, taskInput, setTaskInput
    })

    return (
        <div style={CARD_STYLE}>
            <ProjectHeader project={project} color={color} confirmDelete={confirmDelete}
                onDeleteClick={() => setConfirmDelete(true)} onConfirmDelete={deleteProject}
                onCancelDelete={() => setConfirmDelete(false)} />
            <TaskInputRow taskInput={taskInput} setTaskInput={setTaskInput} addOrStartTask={addOrStartTask}
                suggestions={suggestions} pid={pid} startTimer={startTimer} />
            <ProjectTaskList project={project} pid={pid} state={state} updateState={updateState}
                startTimer={startTimer} activeTimer={activeTimer} stopTimer={stopTimer} />
        </div>
    )
}
