import { useTranslation } from 'react-i18next'

/**
 * A card displaying a tour's image (or icon fallback), title and description.
 * @param {{ tour: { id: string, title: string, description: string, icon: string, image?: string }, onClick: Function }} props
 */
export default function TourCard({ tour, onClick }) {
  const { t } = useTranslation()
  const title = t(`tours.${tour.id}.title`, tour.title)

  return (
    <button className={`tour-card ${tour.image ? 'tour-card--gradient' : ''}`} onClick={onClick}>
      <div className="tour-card__image">
        {tour.image
          ? <img src={tour.image} alt={title} className="tour-card__img" />
          : <span
              className="ms tour-card__icon"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}
            >
              {tour.icon}
            </span>
        }
      </div>
      <div className="tour-card__body">
        <span className="tour-card__title">{title}</span>
      </div>
    </button>
  )
}
import { useTranslation } from 'react-i18next'

/**
 * A card displaying a tour's image (or icon fallback), title and description.
 * @param {{ tour: { id: string, title: string, description: string, icon: string, image?: string }, onClick: Function }} props
 */
export default function TourCard({ tour, onClick }) {
  const { t } = useTranslation()
  const title = t(`tours.${tour.id}.title`, tour.title)

  return (
    <button className={`tour-card ${tour.image ? 'tour-card--gradient' : ''}`} onClick={onClick}>
      <div className="tour-card__image">
        {tour.image
          ? <img src={tour.image} alt={title} className="tour-card__img" />
          : <span
              className="ms tour-card__icon"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}
            >
              {tour.icon}
            </span>
        }
      </div>
      <div className="tour-card__body">
        <span className="tour-card__title">{title}</span>
      </div>
    </button>
  )
}
