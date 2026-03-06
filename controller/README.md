# Guide Controller

Webbapp för guiden. Skapar en session, visar anslutna headsets och styr vilken scen som är aktiv.

## Kom igång

### 1. Installera beroenden

```bash
npm install
```

### 2. Miljövariabler

Skapa en `.env`-fil i `controller/`-mappen:

```
VITE_FIREBASE_API_KEY=din-nyckel-här
```


### 3. Starta lokalt

```bash
npm run dev
```



## Användning

1. Öppna appen i en webbläsare
2. Session-ID och QR-kod visas automatiskt
3. Låt besökarna scanna QR-koden med headsetets webbläsare
4. När minst ett headset är anslutet — tryck **Start tour**
5. Välj scen i listan — alla anslutna headsets uppdateras direkt

## Projektstruktur

```
src/
  App.jsx              # Root, hanterar state och Firebase-anslutning
  scenes.js            # Scenernas definitioner (id, label, ikon, färg)
  pages/
    SessionPage.jsx    # Startsida med QR-kod och headset-lista
    MainPage.jsx       # Tourkontroll med scenknappar
  components/
    SessionCard.jsx    # Visar session-ID och QR-kod
    HeadsetList.jsx    # Visar anslutna headsets och Firebase-status
    SceneBtn.jsx       # Knapp för att välja scen
  utils/
    status_maps.js     # Statuskonstanter för headsets och Firebase

```

## Dev-verktyg

`JoinMock` är ett temporärt verktyg (visas uppe till höger i dev-läge) för att simulera headsets utan att ha ett riktigt headset tillgängligt. **Ska tas bort när klientappen är implementerad.**