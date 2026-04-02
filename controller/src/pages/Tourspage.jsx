import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TourCard from '../components/Tourcard'
import TopAppBar from '../components/TopAppBar'
import Section from '../components/Section'
import { tours } from '../../../tours/index'

/** Tour selection page — lists all available tours for the guide to choose from. */
export default function ToursPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="page">
      <TopAppBar title="" onBack={() => navigate('/')} />

      <div className="page-content">
        <div className="tours-header">
          <span className="tours-header__sub">{t('toursPage.guidesIn')}</span>
          <h2 className="tours-header__city">{t('toursPage.city')}</h2>
        </div>

        <Section title={t('toursPage.selectTour')}>
          <div className="tour-grid">
            {tours.map(tour => (
              <TourCard
                key={tour.id}
                tour={tour}
                onClick={() => navigate(`/tour?tourId=${tour.id}`)}
              />
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
