export const HEADSET_STATUS = {
  CONNECTED:    'connected',
  CONNECTING:   'connecting',
  ERROR:        'error',
  DISCONNECTED: 'disconnected',
}

const INITIAL_HEADSETS = [
  { id: 'hs-1', label: 'Headset 1', status: 'disconnected' },
  { id: 'hs-2', label: 'Headset 2', status: 'disconnected' },
  { id: 'hs-3', label: 'Headset 3', status: 'disconnected' },
  { id: 'hs-4', label: 'Headset 4', status: 'disconnected' },
]

// create copy of headsets
let headsets = INITIAL_HEADSETS.map(h => ({ ...h }))
// initiate array of callbacks
let listeners = []

// helper changes status on headset via id
// notifies listeners with updated headsets
function setHeadset(id, status) {
  headsets = headsets.map(h => h.id === id ? { ...h, status } : h)
  listeners.forEach(cb => cb([...headsets]))
}
// spara active scene i adapter, för att kunna skicka till headset vid återanslutning
//let activescene = null

export const adapter = {

  

  // real adapter stores lastScene here to re-send on headset reconnect
  publish: async (sceneId, sessionId) => {
    // activescene = sceneId
    console.log('Scene triggered:', sceneId)
    console.log('Active session:', sessionId)
  },

  // Simulates headset connections
  // all connecting then different behaviours
   
  connect: async (sessionId) => {
    console.log('connected to firebase, session:', sessionId)

    // All start connecting
    headsets = headsets.map(h => ({ ...h, status: 'connecting' }))
    listeners.forEach(cb => cb([...headsets]))

    // set status on headsets after timeout
    setTimeout(() => setHeadset('hs-1', 'connected'), 2000)
    setTimeout(() => setHeadset('hs-3', 'error'), 4000)
    setTimeout(() => setHeadset('hs-4', 'connected'), 3000)
    setTimeout(() => setHeadset('hs-4', 'disconnected'), 6000)
  },

  onHeadsetsChange: (cb) => {
    listeners.push(cb)
    cb([...headsets])
    return () => { listeners = listeners.filter(l => l !== cb) }
  },
}
