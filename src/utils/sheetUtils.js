import { addDays, toDateKey } from './chartUtils'

export const ROW_HEIGHT = 32  // pixels per 30-minute slot

export function getSheetWeekDays(today, weekOffset) {
    const dow = today.getDay()  // 0 = Sun, 6 = Sat
    const daysSinceSat = dow === 6 ? 0 : dow + 1
    const saturday = addDays(today, weekOffset * 7 - daysSinceSat)
    return Array.from({ length: 7 }, (_, idx) => addDays(saturday, idx))
}

export function getSheetWeekLabel(weekOffset, weekDays) {
    if (weekOffset === 0) return 'This week'
    if (weekOffset === -1) return 'Last week'
    const start = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const end = weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${start} – ${end}`
}

export function getSessionPlacement(session, weekDays) {
    if (!session.startTime) return null
    const startDate = new Date(session.startTime)
    const dayIndex = weekDays.findIndex(day => toDateKey(day) === toDateKey(startDate))
    if (dayIndex === -1) return null
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes()
    const durationMinutes = session.seconds / 60
    return { dayIndex, startMinutes, durationMinutes }
}

export function minutesToPixels(minutes) {
    return (minutes / 30) * ROW_HEIGHT
}
