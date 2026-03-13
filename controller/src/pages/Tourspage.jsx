import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TourCard from '../components/Tourcard'
import { tours } from '../tours'

export default function ToursPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="page">
      <div className="top-app-bar">
        <span className="top-app-bar__title"></span>
        <button
          className="icon-btn"
          onClick={() => navigate('/settings')}
          aria-label={t('nav.settings')}
        >
          <span className="ms">settings</span>
        </button>
      </div>

      <div className="page-content">
        <div className="tours-header">
          <span className="tours-header__sub">{t('toursPage.guidesIn')}</span>
          <h2 className="tours-header__city">{t('toursPage.city')}</h2>
        </div>

        <p className="section-label">{t('toursPage.selectTour')}</p>

        <div className="tour-grid">
          {tours.map(tour => (
            <TourCard
              key={tour.id}
              tour={tour}
              onClick={() => navigate('/session', { state: { tour } })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
