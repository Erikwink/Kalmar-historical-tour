Controller — Buildplan
Stack

React (Vite) — snabb setup, inget onödigt
Vanilla CSS — ingen styling-overhead, det ska vara funktionellt
backend-adapter — importeras direkt, ingen egen nätverkskod


Steg 1 — Projektsetup
bashnpm create vite@latest controller -- --template react
cd controller
npm install
Lägg till backend-adaptern när den finns:
bashnpm install ../backend-adapter  # lokal workspace-länk
```

---

### Steg 2 — Filstruktur
```
controller/
├── src/
│   ├── main.jsx
│   ├── App.jsx              # Root, håller activeScene i state
│   ├── scenes.js            # Scen-definitioner (ID + namn + färg)
│   ├── components/
│   │   ├── SceneButton.jsx  # En knapp per scen
│   │   └── StatusBar.jsx    # Visar anslutningsstatus + aktiv scen
│   └── index.css            # Minimalt, stort touch-target fokus
└── index.html

Steg 3 — Datamodell
scenes.js är den enda filen du redigerar när du lägger till en ny scen:
jsexport const scenes = [
  { id: 'waiting',        label: 'Vänta på start',       color: '#4A90D9' },
  { id: 'remove-headset', label: 'Ta av headset',         color: '#E67E22' },
  { id: 'church',         label: 'Medeltidskyrkan',       color: '#8B6914' },
  { id: 'danish-raids',   label: 'Danska anfallet',       color: '#C0392B' },
]
```

---

### Steg 4 — Komponentlogik

**`App.jsx`** håller all state:
```
activeScene (string)     — vilken scen som är aktiv
status ('connected' | 'connecting' | 'error')
```

När en knapp trycks: `adapter.publish(sceneId)` → uppdatera `activeScene`.

**`SceneButton.jsx`** tar emot:
```
scene       — { id, label, color }
isActive    — bool
onPress     — callback
Aktiv scen får tydlig visuell markering (border, opacity på övriga).
StatusBar.jsx visar:

Grön/röd prick för anslutningsstatus
Namn på aktiv scen
Sitter fast längst upp, alltid synlig


Steg 5 — Mobil-UX-krav
Controllern används utomhus på en telefon med handskar eller i sol. Prioritera:

Minst 80px touch target per knapp — ingen risk att missa
Hög kontrast — fungerar i starkt solljus
Ingen scroll om möjligt — alla scener synliga direkt
Ingen bekräftelsedialog — ett tryck = aktivt, snabbt
Stora, tydliga knappar med scenens färg som bakgrund


Steg 6 — Adapter-integration
Tills backend-adapter är byggd, använd en mock:
js// src/adapter-mock.js
export const adapter = {
  publish: async (sceneId) => {
    console.log('Scene triggered:', sceneId)
  },
  subscribe: (cb) => () => {}
}
Byt ut mot riktiga adaptern när den är klar — App.jsx märker ingen skillnad.

Steg 7 — Testning
Testa tidigt och ofta på faktisk telefon, inte bara i webbläsaren:

Använd ngrok eller Vites --host för att exponera lokalt
Testa med solljus och handskar om möjligt
Ha en annan person trycka för att verifiera att headset-klienten reagerar


Ordning att bygga

scenes.js — definiera alla scener
App.jsx med hårdkodad mock-publish
SceneButton.jsx + StatusBar.jsx
CSS — fokus på storlek och kontrast
Koppla in riktiga adaptern
Testa på telefon