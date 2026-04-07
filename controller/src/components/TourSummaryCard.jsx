import { useTranslation } from 'react-i18next'

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}min` : `${h}h`
}
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatTimeRange(durationMinutes) {
  const start = new Date()
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  return `${formatTime(start)} - ${formatTime(end)}`
}

/**
 * Displays stop count and duration for a tour.
 * @param {{ tour: object, scenes: Array }} props
 */
export default function TourSummaryCard({ tour, scenes }) {
  const { t } = useTranslation()
  const timeRange = tour?.durationMinutes ? formatTimeRange(tour.durationMinutes) : null

  return (
    <div className="card tour-summary">
      <div className="tour-summary__meta">
        <span>{scenes.length} {t('overviewPage.stops')} - {formatDuration(tour?.durationMinutes)}</span>
        {timeRange && <span> · {timeRange}</span>}
      </div>
    </div>
  )
}
