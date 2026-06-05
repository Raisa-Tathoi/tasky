import { useState } from 'react'
import { PROJECT_COLORS } from '../store'

const OVERLAY = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
}
const MODAL = {
    background: '#fff', borderRadius: 16, padding: '1.5rem',
    width: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
}
const LIST_CARD = {
    background: '#fff', border: '1px solid #e8e8e4',
    borderRadius: 16, padding: '0.75rem 1.25rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
}
const LIST_HEADER = {
    display: 'flex', gap: 12, padding: '4px 0 10px',
    borderBottom: '1px solid #eee', marginBottom: 2
}
const COL_LABEL = {
    fontSize: 10, fontWeight: 600, color: '#bbb',
    textTransform: 'uppercase', letterSpacing: '0.06em'
}

function rowStyle(done) {
    return {
        display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
        borderBottom: '1px solid #f0f0f0', opacity: done ? 0.45 : 1
    }
}

function taskNameStyle(done) {
    return { flex: 1, fontSize: 13, textDecoration: done ? 'line-through' : 'none', color: done ? '#aaa' : '#222' }
}

function tagStyle(color) {
    return {
        fontSize: 11, padding: '2px 8px', background: color + '22', color,
        borderRadius: 99, minWidth: 60, textAlign: 'center', flexShrink: 0, whiteSpace: 'nowrap'
    }
}

function findProjectByName(projects, name) {
    return Object.entries(projects).find(
        ([, p]) => p.name.toLowerCase() === name.trim().toLowerCase()
    )
}

function resolveProject(state, pName) {
    const existing = findProjectByName(state.projects, pName)
    if (existing) return { pid: existing[0], project: existing[1] }
    const pid = 'p_' + Date.now()
    const colorIndex = Object.keys(state.projects).length % 8
    const project = { name: pName, totalTime: 0, colorIndex, tasks: {} }
    return { pid, project }
}

function buildAddTodoTaskState(state, taskName, projectName, dueDate) {
    const name = taskName.trim()
    const pName = projectName.trim()
    if (!name || !pName) return state
    const { pid, project } = resolveProject(state, pName)
    const taskId = 't_' + Date.now()
    const newTask = { name, totalTime: 0, status: 'active', dueDate: dueDate || null }
    const tasks = { ...project.tasks, [taskId]: newTask }
    return { ...state, projects: { ...state.projects, [pid]: { ...project, tasks } } }
}

function buildToggleTaskState(state, pid, tid) {
    const task = state.projects[pid].tasks[tid]
    const newStatus = (!task.status || task.status === 'active') ? 'done' : 'active'
    const updatedTask = { ...task, status: newStatus }
    const tasks = { ...state.projects[pid].tasks, [tid]: updatedTask }
    const project = { ...state.projects[pid], tasks }
    return { ...state, projects: { ...state.projects, [pid]: project } }
}

function collectAllTasks(projects) {
    return Object.entries(projects).flatMap(([pid, project]) =>
        Object.entries(project.tasks).map(([tid, task]) => ({
            tid, pid, task, projectName: project.name, colorIndex: project.colorIndex
        }))
    )
}

function TaskRow({ pid, tid, task, projectName, colorIndex, onToggle }) {
    const done = task.status === 'done'
    const color = PROJECT_COLORS[colorIndex]
    return (
        <div style={rowStyle(done)}>
            <input type="checkbox" checked={done} onChange={() => onToggle(pid, tid)}
                style={{ width: 15, height: 15, cursor: 'pointer', accentColor: color, flexShrink: 0 }} />
            <span style={taskNameStyle(done)}>{task.name}</span>
            <span style={{ fontSize: 12, color: '#bbb', minWidth: 80, textAlign: 'right', flexShrink: 0 }}>
                {task.dueDate || ''}
            </span>
            <span style={tagStyle(color)}>{projectName}</span>
        </div>
    )
}

function TodoList({ activeTasks, doneTasks, onToggle }) {
    return (
        <div style={LIST_CARD}>
            <div style={LIST_HEADER}>
                <span style={{ width: 15, flexShrink: 0 }} />
                <span style={{ ...COL_LABEL, flex: 1 }}>Task</span>
                <span style={{ ...COL_LABEL, minWidth: 80, textAlign: 'right' }}>Due</span>
                <span style={{ ...COL_LABEL, minWidth: 60, textAlign: 'center' }}>Project</span>
            </div>
            {activeTasks.length === 0 && doneTasks.length === 0 && (
                <p style={{ color: '#aaa', fontSize: 13, padding: '12px 0 4px' }}>No tasks yet. Add one above.</p>
            )}
            {activeTasks.map(t => <TaskRow key={t.tid} {...t} onToggle={onToggle} />)}
            {doneTasks.map(t => <TaskRow key={t.tid} {...t} onToggle={onToggle} />)}
        </div>
    )
}

function ModalFields({
    state, taskName, setTaskName, projectName, setProjectName, dueDate, setDueDate, onKeyDown
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Task Name" value={taskName}
                onChange={e => setTaskName(e.target.value)} onKeyDown={onKeyDown} autoFocus />
            <input placeholder="Project Name" value={projectName}
                onChange={e => setProjectName(e.target.value)} onKeyDown={onKeyDown} list="todo-project-suggestions" />
            <datalist id="todo-project-suggestions">
                {Object.values(state.projects).map(p => <option key={p.name} value={p.name} />)}
            </datalist>
            <input type="date" value={dueDate}
                onChange={e => setDueDate(e.target.value)} onKeyDown={onKeyDown} />
        </div>
    )
}

function ModalContent({
    state, taskName, setTaskName, projectName, setProjectName,
    dueDate, setDueDate, onKeyDown, onAdd, onClose
}) {
    return (
        <div style={MODAL}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: 15, fontWeight: 600 }}>Add Task</h3>
            <ModalFields
                state={state} taskName={taskName} setTaskName={setTaskName}
                projectName={projectName} setProjectName={setProjectName}
                dueDate={dueDate} setDueDate={setDueDate} onKeyDown={onKeyDown}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button onClick={onClose}>Cancel</button>
                <button onClick={onAdd} className="btn-primary">Add</button>
            </div>
        </div>
    )
}

function AddTaskModal({ state, onAdd, onClose }) {
    const [taskName, setTaskName] = useState('')
    const [projectName, setProjectName] = useState('')
    const [dueDate, setDueDate] = useState('')

    function handleAdd() {
        if (!taskName.trim() || !projectName.trim()) return
        onAdd(taskName, projectName, dueDate)
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') handleAdd()
        if (e.key === 'Escape') onClose()
    }

    return (
        <div style={OVERLAY} onClick={e => e.target === e.currentTarget && onClose()}>
            <ModalContent
                state={state}
                taskName={taskName} setTaskName={setTaskName}
                projectName={projectName} setProjectName={setProjectName}
                dueDate={dueDate} setDueDate={setDueDate}
                onKeyDown={handleKeyDown} onAdd={handleAdd} onClose={onClose}
            />
        </div>
    )
}

export default function Todo({ state, updateState }) {
    const [showModal, setShowModal] = useState(false)
    const allTasks = collectAllTasks(state.projects)
    const activeTasks = allTasks.filter(({ task }) => !task.status || task.status === 'active')
    const doneTasks = allTasks.filter(({ task }) => task.status === 'done')

    function toggleTask(pid, tid) {
        updateState(buildToggleTaskState(state, pid, tid))
    }

    function addTask(taskName, projectName, dueDate) {
        updateState(buildAddTodoTaskState(state, taskName, projectName, dueDate))
        setShowModal(false)
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button onClick={() => setShowModal(true)} className="btn-primary">Add Task</button>
            </div>
            <TodoList activeTasks={activeTasks} doneTasks={doneTasks} onToggle={toggleTask} />
            {showModal && <AddTaskModal state={state} onAdd={addTask} onClose={() => setShowModal(false)} />}
        </div>
    )
}
