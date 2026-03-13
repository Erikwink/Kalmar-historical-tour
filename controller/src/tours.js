import kalmarKyrka from './img/kalmar-kyrka.png'
import kalmarSund from './img/kalmar-sund.png'
import kalmarUnion from './img/kalmar-union.png'
import kalmarSlott from './img/kalmar-slott.png'

export const tours = [
  {
    id: 'kalmar-medeltid',
    title: 'Kalmar Medeltid',
    image: kalmarKyrka,
    icon: 'castle',
    scenes: [
      { id: 'waiting',        label: 'Vänta på start',  icon: 'schedule',    color: '#FFB95A' },
      { id: 'remove-headset', label: 'Ta av headset',   icon: 'headset_off', color: '#FFB4AB' },
      { id: 'castle',         label: 'Kalmar slott',    icon: 'castle',      color: '#CFBCFF' },
      { id: 'church',         label: 'Kalmar domkyrka', icon: 'church',      color: '#A8C7FA' },
      { id: 'audio',          label: 'Präst talar',      icon: 'man',      color: '#A8C7FA' },
    ],
  },
  {
    id: 'kalmarsund',
    title: 'Kalmarsund',
    image: kalmarSund,
    icon: 'sailing',
    scenes: [
      { id: 'waiting',        label: 'Vänta på start', icon: 'schedule',    color: '#FFB95A' },
      { id: 'remove-headset', label: 'Ta av headset',  icon: 'headset_off', color: '#FFB4AB' },
      { id: 'harbor',         label: 'Hamnen',         icon: 'anchor',      color: '#9DD6C8' },
      { id: 'boats',          label: 'Slagskeppet',    icon: 'sailing',     color: '#9DD6C8' },
    ],
  },
  {
    id: 'kalmar-union',
    title: 'Kalmarunionen',
    image: kalmarUnion,
    icon: 'account_balance',
    scenes: [
      { id: 'waiting',        label: 'Vänta på start', icon: 'schedule',        color: '#FFB95A' },
      { id: 'remove-headset', label: 'Ta av headset',  icon: 'headset_off',     color: '#FFB4AB' },
      { id: 'throne-room',    label: 'Tronsalen',      icon: 'account_balance', color: '#CFBCFF' },
    ],
  },
  {
    id: 'kalmar-slott',
    title: 'Kalmar Slott',
    image: kalmarSlott,
    icon: 'castle',
    scenes: [
      { id: 'waiting',        label: 'Vänta på start', icon: 'schedule',    color: '#FFB95A' },
      { id: 'remove-headset', label: 'Ta av headset',  icon: 'headset_off', color: '#FFB4AB' },
      { id: 'city-center',    label: 'Centrum',        icon: 'castle',      color: '#A8C7FA' },
    ],
  },
]
