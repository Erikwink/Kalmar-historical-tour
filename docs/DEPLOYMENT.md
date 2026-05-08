# Deployment Guide

## Förutsättningar

- Åtkomst till Firebase-projektet `kalmar-historical-tour`
- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`

---

## Första gången — engångsinställning

### 1. Logga in och koppla targets

```bash
firebase login
firebase target:apply hosting controller kalmar-controller
firebase target:apply hosting client kalmar-client
```

### 2. Verifiera

```bash
firebase target
```

---

## Deploy-flöde

```
development → PR → main → skapa GitHub Release + tag → Actions deployer
```

Deploy sker **bara** när en release publiceras i GitHub — inte vid varje merge.

---

## Göra en release

### Välj rätt tag beroende på vad som ska deployas

| Tag | Vad deployas |
|-----|-------------|
| `controller-v1.0.0` | Bara controller |
| `client-v1.0.0` | Bara client |
| `v1.0.0` | Båda |

### Steg för steg

1. Merga PR från `development` → `main`
2. Gå till GitHub → **Releases** → **Draft a new release**
3. Klicka **Choose a tag** och skriv in taggen, t.ex. `controller-v1.0.0`
4. Välj `main` som target branch
5. Fyll i release notes
6. Klicka **Publish release**
7. GitHub Actions bygger och deployer automatiskt — följ förloppet under **Actions**-fliken

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
cd controller && npm run build && cd ..
cd client && npm run build && cd ..

firebase deploy --only hosting:controller
firebase deploy --only hosting:client

# Stänga ner en site
firebase hosting:disable --site kalmar-controller
firebase hosting:disable --site kalmar-client
```

---

## URLs

| App | URL |
|-----|-----|
| Controller (guide) | `https://kalmar-controller.web.app` |
| Client (headset) | `https://kalmar-client.web.app` |