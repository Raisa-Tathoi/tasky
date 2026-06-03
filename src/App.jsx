import { useState } from 'react'
import ProjectList from './components/ProjectList'
import Charts from './components/Charts'
import Sheet from './components/Sheet'
import Timer from './components/Timer'
import { loadState, saveState, genId, todayKey } from './store'

function buildTimerState(state, activeTimer, elapsed) {
    const { projectId, taskId } = activeTimer
    const project = state.projects[projectId]
    return {
        ...state,
        projects: {
            ...state.projects,
            [projectId]: {
                ...project,
                totalTime: project.totalTime + elapsed,
                tasks: {
                    ...project.tasks,
                    [taskId]: {
                        ...project.tasks[taskId],
                        totalTime: project.tasks[taskId].totalTime + elapsed
                    }
                }
            }
        },
        sessions: [
            ...state.sessions,
            { id: genId(), date: todayKey(), projectId, taskId, seconds: elapsed, startTime: activeTimer.startTime }
        ]
    }
}

function ViewTabs({ view, onChangeView }) {
    return (
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', justifyContent: 'center' }}>
            <button
                onClick={() => onChangeView('tasks')}
                className={view === 'tasks' ? 'tab active' : 'tab'}
            >Tasks</button>
            <button
                onClick={() => onChangeView('charts')}
                className={view === 'charts' ? 'tab active' : 'tab'}
            >Charts</button>
            <button
                onClick={() => onChangeView('sheet')}
                className={view === 'sheet' ? 'tab active' : 'tab'}
            >Sheet</button>
        </div>
    )
}

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
        updateState(buildTimerState(state, activeTimer, elapsed))
        setActiveTimer(null)
    }

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
            <ViewTabs view={view} onChangeView={setView} />
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
            {view === 'sheet' && <Sheet state={state} updateState={updateState} />}
            {activeTimer && <Timer activeTimer={activeTimer} state={state} stopTimer={stopTimer} />}
        </div>
    )
}
