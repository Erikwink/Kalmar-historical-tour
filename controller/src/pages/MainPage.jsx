import StatusBar from '../components/statusBar'
import HeadsetList from '../components/headsetList'
import SceneBtn from '../components/sceneBtn'
import { scenes } from '../scenes'

export default function MainPage({ 
  headsets, 
  adapterStatus, 
  activeScene, 
  onScenePress
 }) {

  return (
    <div className="page">
      <StatusBar 
        activeScene={scenes.find(s => s.id === activeScene)} 
      />
      
      <HeadsetList 
        headsets={headsets} 
        adapterStatus={adapterStatus} 
      />
      <div className="scene-list">
        {scenes.map(scene => (
          <SceneBtn
            key={scene.id}
            scene={scene}
            isActive={scene.id === activeScene}
            onClick={() => onScenePress(scene.id)}
          />
        ))}
      </div>
    </div>
  )
}
