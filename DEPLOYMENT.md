# Deployment Guide

## Förutsättningar

- Åtkomst till Firebase-projektet `kalmar-historical-tour`
- Admin-rättigheter på GitHub-repot (för att lägga till Secrets)
- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`

---

## Första gången — engångsinställning

### 1. Skapa Hosting-sites i Firebase Console

1. Gå till [Firebase Console](https://console.firebase.google.com) → projektet `kalmar-historical-tour`
2. Välj **Hosting** i sidomenyn
3. Klicka **Add another site** och skapa två sites:
   - `kalmar-controller`
   - `kalmar-client`

### 2. Koppla Firebase CLI till projektet

```bash
firebase login
firebase target:apply hosting controller kalmar-controller
firebase target:apply hosting client kalmar-client
```

Verifiera att det ser rätt ut:
```bash
firebase target
```

### 3. Hämta service account för GitHub Actions

1. Gå till Firebase Console → **Project Settings** → **Service accounts**
2. Klicka **Generate new private key** — ladda ner JSON-filen
3. Gå till GitHub-repot → **Settings** → **Secrets and variables** → **Actions**
4. Lägg till följande secrets:

| Secret | Värde |
|--------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | Hela innehållet i den nedladdade JSON-filen |
| `VITE_FIREBASE_API_KEY` | API-nyckeln från Firebase-projektet |
| `VITE_FIREBASE_EMAIL` | Service-kontots e-post (används av controller) |
| `VITE_FIREBASE_PASSWORD` | Lösenord för ovanstående konto |

> **OBS:** Committa aldrig `.env`-filer med riktiga värden. Se till att `.env` finns i `.gitignore`.

---

## Deploy-flöde (efter att allt är uppsatt)

```
feature/xxx  →  development  →  PR  →  main  →  auto-deploy
```

1. Jobba på `development` eller en feature-branch
2. Skapa en Pull Request från `development` → `main`
3. Granska och merga PR:n
4. GitHub Actions bygger controller och client automatiskt och deployer till Firebase Hosting
5. Kontrollera att deployn lyckades under **Actions**-fliken i GitHub

---

## Göra en release

1. Vänta tills deployn från `main` är klar och verifierad
2. Gå till GitHub → **Releases** → **Draft a new release**
3. Klicka **Choose a tag** och skapa en ny tag, t.ex. `v1.0.0`
4. Välj `main` som target branch
5. Fyll i release notes — vad är nytt, vad är fixat
6. Klicka **Publish release**

### Versionsschema (semver)

```
v<major>.<minor>.<patch>

v1.0.0  — första stabila release
v1.1.0  — ny funktionalitet
v1.1.1  — buggfix
v2.0.0  — större omskrivning / breaking change
```

---

## Manuell deploy (vid behov)

```bash
# Bygg båda apparna
cd controller && npm run build && cd ..
cd client && npm run build && cd ..

# Deploya
firebase deploy --only hosting
```

---

## URLs efter deploy

| App | URL |
|-----|-----|
| Controller (guide) | `https://kalmar-controller.web.app` |
| Client (headset) | `https://kalmar-client.web.app` |