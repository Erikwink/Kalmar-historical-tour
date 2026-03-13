import { useNavigate } from 'react-router-dom'
import TourCard from '../components/Tourcard'
import { tours } from '../tours'

export default function ToursPage() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="top-app-bar">
        <span className="top-app-bar__title"></span>
        <button
          className="icon-btn"
          onClick={() => navigate('/settings')}
          aria-label="Inställningar"
        >
          <span className="ms">settings</span>
        </button>
      </div>

      <div className="page-content">
        <div className="tours-header">
          <span className="tours-header__sub">Guider i</span>
          <h2 className="tours-header__city">Kalmar</h2>
        </div>

        <p className="section-label">Välj tour</p>

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
