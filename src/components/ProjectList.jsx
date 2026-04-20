import { useState } from 'react'
import { saveState } from '../store'
import Project from './Project'

export default function ProjectList({ state, updateState, startTimer, activeTimer, stopTimer }) {
    const [newName, setNewName] = useState('')

    function addProject() {
        const name = newName.trim()
        if (!name) return
        const id = 'p_' + Date.now()
        const newState = {
            ...state,
            projects: {
                ...state.projects,
                [id]: {
                    name,
                    totalTime: 0,
                    colorIndex: Object.keys(state.projects).length % 8,
                    tasks: {}
                }
            }
        }
        updateState(newState)
        setNewName('')

        function getLastWorkedMap(sessions) {
            const map = {}

            for (const s of sessions) {
                const ts = new Date(s.date).getTime()
                map[s.projectId] = Math.max(map[s.projectId] || 0, ts)
            }

            return map
        }

        const lastWorked = getLastWorkedMap(state.sessions)

        const sortedProjects = Object.entries(state.projects).sort(
            ([aId], [bId]) => (lastWorked[bId] || 0) - (lastWorked[aId] || 0)
        )
    }

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: '2rem' }}>
                <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addProject()}
                    placeholder="New project name..."
                />
                <button onClick={addProject}>Add project</button>
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