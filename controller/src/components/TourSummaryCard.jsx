import { useTranslation } from 'react-i18next'

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

/**
 * Displays stop count and duration for a tour.
 * @param {{ tour: object, scenes: Array }} props
 */
export default function TourSummaryCard({ tour, scenes }) {
  const { t } = useTranslation()
  return (
    <div className="card tour-summary">
      <div className="tour-summary__meta">
        <span>{scenes.length} {t('overviewPage.stops')}</span>
        {tour?.durationMinutes && (
          <span> · {formatDuration(tour.durationMinutes)}</span>
        )}
      </div>
    </div>
  )
}
