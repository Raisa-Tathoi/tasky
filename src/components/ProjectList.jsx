import { useState } from 'react'
import Project from './Project'

function getLastWorkedMap(sessions) {
    const map = {}
    for (const session of sessions) {
        const timestamp = new Date(session.date).getTime()
        map[session.projectId] = Math.max(map[session.projectId] || 0, timestamp)
    }
    return map
}

function getSortedProjects(state) {
    const projects = state.projects || {}
    const knownOrder = (state.projectOrder || []).filter(pid => projects[pid])
    const known = new Set(knownOrder)
    const lastWorked = getLastWorkedMap(state.sessions || [])
    const newOnes = Object.keys(projects).filter(pid => !known.has(pid))
        .sort((a, b) => (lastWorked[b] || 0) - (lastWorked[a] || 0))
    return [...knownOrder, ...newOnes].map(pid => [pid, projects[pid]])
}

function buildNewProjectState(state, name) {
    const projectId = 'p_' + Date.now()
    return {
        ...state,
        projects: {
            ...state.projects,
            [projectId]: {
                name,
                totalTime: 0,
                colorIndex: Object.keys(state.projects).length % 8,
                tasks: {}
            }
        }
    }
}

function reorderProjectIds(orderedIds, fromPid, toPid) {
    if (!fromPid || fromPid === toPid) return null
    const fromIdx = orderedIds.indexOf(fromPid)
    const toIdx = orderedIds.indexOf(toPid)
    if (fromIdx === -1 || toIdx === -1) return null
    const newOrder = [...orderedIds]
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, fromPid)
    return newOrder
}

function makeDragHandlers(drag, setDrag, orderedIds, state, updateState) {
    const reset = () => setDrag({ from: null, over: null })
    return {
        onDragStart: (pid, e) => {
            setDrag({ from: pid, over: null })
            e.dataTransfer.effectAllowed = 'move'
        },
        onDragOver: (pid, e) => {
            e.preventDefault()
            if (pid !== drag.from && pid !== drag.over) setDrag(d => ({ ...d, over: pid }))
        },
        onDrop: (targetPid) => {
            const newOrder = reorderProjectIds(orderedIds, drag.from, targetPid)
            if (newOrder) updateState({ ...state, projectOrder: newOrder })
            reset()
        },
        onDragEnd: reset
    }
}

function AddProjectRow({ newName, setNewName, addProject }) {
    return (
        <div style={{ display: 'flex', gap: 8, marginBottom: '2rem' }}>
            <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addProject()}
                placeholder="New project name..."
            />
            <button onClick={addProject} className="btn-primary">Add project</button>
        </div>
    )
}

function DraggableProject({ pid, project, isDragging, isOver, dragHandlers, projectProps }) {
    return (
        <div
            draggable
            onDragStart={(e) => dragHandlers.onDragStart(pid, e)}
            onDragOver={(e) => dragHandlers.onDragOver(pid, e)}
            onDrop={() => dragHandlers.onDrop(pid)}
            onDragEnd={dragHandlers.onDragEnd}
            style={{
                opacity: isDragging ? 0.4 : 1,
                outline: isOver ? '2px solid #378ADD' : 'none',
                outlineOffset: -2, borderRadius: 16
            }}
        >
            <Project pid={pid} project={project} {...projectProps} />
        </div>
    )
}

function ProjectListBody({ sortedProjects, drag, dragHandlers, projectProps }) {
    if (sortedProjects.length === 0) {
        return <p style={{ color: '#888', fontSize: 13 }}>No projects yet.</p>
    }
    return (
        <>
            {sortedProjects.map(([pid, project]) => (
                <DraggableProject key={pid} pid={pid} project={project}
                    isDragging={drag.from === pid} isOver={drag.over === pid}
                    dragHandlers={dragHandlers} projectProps={projectProps} />
            ))}
        </>
    )
}

export default function ProjectList({ state, updateState, startTimer, activeTimer, stopTimer }) {
    const [newName, setNewName] = useState('')
    const [drag, setDrag] = useState({ from: null, over: null })
    const sortedProjects = getSortedProjects(state)
    const orderedIds = sortedProjects.map(([pid]) => pid)
    const dragHandlers = makeDragHandlers(drag, setDrag, orderedIds, state, updateState)
    const projectProps = { state, updateState, startTimer, activeTimer, stopTimer }

    function addProject() {
        const name = newName.trim()
        if (!name) return
        updateState(buildNewProjectState(state, name))
        setNewName('')
    }

    return (
        <div>
            <AddProjectRow newName={newName} setNewName={setNewName} addProject={addProject} />
            <ProjectListBody sortedProjects={sortedProjects} drag={drag}
                dragHandlers={dragHandlers} projectProps={projectProps} />
        </div>
    )
}
