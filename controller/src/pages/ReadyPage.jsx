import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TopAppBar from '../components/TopAppBar'
import Fab from '../components/Fab'
import HeadsetList from '../components/headsetList'
import TourSummaryCard from '../components/TourSummaryCard'
import { tours } from '../../../tours/index'
import { HEADSET_STATUS } from '../utils/status_maps'

/**
 * Pre-tour confirmation page — shows tour info and headset status before starting.
 * @param {{ headsets: Array, adapterStatus: string|null }} props
 */
export default function ReadyPage({ headsets, adapterStatus }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()

  const tourId = searchParams.get('tourId')
  const tour = tours.find(t => t.id === tourId)
  const scenes = tour?.scenes ?? []

  const headsetsReady = headsets.filter(h => h.status === HEADSET_STATUS.ONLINE && h.ready).length

  return (
    <div className="page">
      <TopAppBar
        title={t(`tours.${tourId}.title`, tour?.title ?? '')}
        onBack={() => navigate('/tours')}
      />

      <div className="page-content">
        <TourSummaryCard 
          tour={tour} 
          scenes={scenes} 
      />
        <HeadsetList
         headsets={headsets}
         adapterStatus={adapterStatus}
         title={t("readyPage.headsets")}
       />
      </div>

      <Fab disabled={headsetsReady != headsets.length} onClick={() => navigate(`/tour?tourId=${tourId}`)}>
        {t('sessionPage.startTour')}
      </Fab>
    </div>
  )
}
