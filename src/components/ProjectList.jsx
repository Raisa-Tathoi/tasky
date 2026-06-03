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

export default function ProjectList({ state, updateState, startTimer, activeTimer, stopTimer }) {
    const [newName, setNewName] = useState('')

    function addProject() {
        const name = newName.trim()
        if (!name) return
        updateState(buildNewProjectState(state, name))
        setNewName('')
    }

    const lastWorked = getLastWorkedMap(state.sessions || [])
    const sortedProjects = Object.entries(state.projects || {}).sort(
        ([aId], [bId]) => (lastWorked[bId] || 0) - (lastWorked[aId] || 0)
    )

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: '2rem' }}>
                <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addProject()}
                    placeholder="New project name..."
                />
                <button onClick={addProject} className="btn-primary">Add project</button>
            </div>

            {Object.keys(state.projects).length === 0 && (
                <p style={{ color: '#888', fontSize: 13 }}>No projects yet.</p>
            )}

            {sortedProjects.map(([pid, project]) => (
                <Project
                    key={pid}
                    pid={pid}
                    project={project}
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
