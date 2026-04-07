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
      <TopAppBar title={t("toursPage.selectTour")} onBack={() => navigate('/')} />

      <div className="page-content">
        <div className="tours-header">
          <h2 className="tours-header__city">{t('toursPage.city')}</h2>
        </div>

        <Section title="">
          <div className="tour-grid">
            {tours.map(tour => (
              <TourCard
                key={tour.id}
                tour={tour}
                onClick={() => navigate(`/tour/pre?tourId=${tour.id}`)}
              />
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
