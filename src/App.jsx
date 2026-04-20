import { useState } from 'react'
import ProjectList from './components/ProjectList'
import Charts from './components/Charts'
import Timer from './components/Timer'
import { loadState, saveState, genId, todayKey } from './store'

export default function App() {
    const [state, setState] = useState(() => loadState())
    const [view, setView] = useState('tasks')
    const [activeTimer, setActiveTimer] = useState(null)

    function updateState(newState) {
        setState(newState)
        saveState(newState)
    }

    function startTimer(projectId, taskId) {
        if (activeTimer) return
        setActiveTimer({ projectId, taskId, startTime: Date.now() })
    }

    function stopTimer() {
        if (!activeTimer) return
        const elapsed = Math.floor((Date.now() - activeTimer.startTime) / 1000)
        const { projectId, taskId } = activeTimer

        const newState = {
            ...state,
            projects: {
                ...state.projects,
                [projectId]: {
                    ...state.projects[projectId],
                    totalTime: state.projects[projectId].totalTime + elapsed,
                    tasks: {
                        ...state.projects[projectId].tasks,
                        [taskId]: {
                            ...state.projects[projectId].tasks[taskId],
                            totalTime: state.projects[projectId].tasks[taskId].totalTime + elapsed
                        }
                    }
                }
            },
            sessions: [
                ...state.sessions,
                { id: genId(), date: todayKey(), projectId, taskId, seconds: elapsed }
            ]
        }

        setActiveTimer(null)
        updateState(newState)
    }

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
                <button onClick={() => setView('tasks')} className={view === 'tasks' ? 'tab active' : 'tab'}>Tasks</button>
                <button onClick={() => setView('charts')} className={view === 'charts' ? 'tab active' : 'tab'}>Charts</button>
            </div>

            {view === 'tasks' && (
                <ProjectList
                    state={state}
                    updateState={updateState}
                    startTimer={startTimer}
                    activeTimer={activeTimer}
                    stopTimer={stopTimer}
                />
            )}
            {view === 'charts' && <Charts state={state} />}

            {activeTimer && (
                <Timer
                    activeTimer={activeTimer}
                    state={state}
                    stopTimer={stopTimer}
                />
            )}
        </div>
    )
}