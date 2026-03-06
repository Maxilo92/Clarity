# Clarity – Intelligent Financial Tracker

Clarity ist eine mandantenfähige Finanzplattform mit Dashboard, Insights, Admin-Tools und KI-Assistent **Clair**.

## Version

- **Aktueller Release (Branch `release`):** **1.8.0**
- Aktueller Stand im Branch `v2`: 1.1.10

### v1.8.0 Highlights
- 📱 **Clair Mobile Optimization:** Vollständige Mobile-Ready Unterstützung für Clair mit `visualViewport` API und Safe-Area Integration
- 🎯 **Touch-Friendly:** 44px Minimum-Touch-Targets für bessere Mobile Usability
- 🔒 **Desktop CSS Fix:** Slider und andere Desktop-Komponenten funktionieren korrekt, wenn Clair geöffnet ist
- ⌨️ **Keyboard Detection:** Verbesserte iOS-Keyboard-Handling für nahtloses Chat-Erlebnis

## Hauptfunktionen

### Dashboard & Transaktionen
- Interaktive Umsatz-/Ausgaben-/Surplus-Visualisierung (Chart.js)
- Zeiträume: Woche, Monat, Jahr, Quartale, benutzerdefinierter Bereich
- Serverseitige Suche, Sortierung und Filterung (Kategorie, Datum, ID, Text)
- Infinite Scroll und Detailansicht mit Bearbeiten/Löschen

### Financial Insights
- Dedizierte Insights-Seite mit Kennzahlen und Diagrammen
- Analyse von Trends, Kategorien und wiederkehrenden Zahlungen
- Grundlage für Forecast- und Budget-Erweiterungen

### Clair AI Assistant
- Kontextbezogene Antworten auf Basis der vorhandenen Finanzdaten
- Tool-gestützte Aktionen (z. B. Transaktion anlegen, Dashboard filtern)
- Fallback-Logik bei Modell-/Tool-Fehlern
- **Mobile-Ready:** Optimiert für Smartphones mit vollständiger Keyboard- und Viewport-Unterstützung

### Admin & Developer Tools
- Multi-User / Multi-Company Setup (eigene `company_<id>.db` je Firma)
- Rollenbasierte Bereiche (Admin/User)
- Developer Tools Seite mit Index-Status und Reindex-Funktionen

## Architektur

- **Backend:** Node.js + Express (`server.js`)
- **Datenbank:** SQLite (`App/db/system.db` + `App/db/company_<id>.db`)
- **Frontend:** HTML, CSS, Vanilla JS
- **AI:** Groq API

## Projektstruktur (Auszug)

- `server.js` – API, Routing, Auth, KI-Endpunkte
- `App/templates/` – Seiten (Dashboard, Insights, Admin, Dev-Tools, etc.)
- `App/static/js/` – Frontend-Logik (Dashboard, Transactions, Clair, Sidebar, Index)
- `App/db/` – Datenbanken und Konfiguration
- `ROADMAP.md` – Produkt- und Clair-Roadmap

## Setup

1. Abhängigkeiten installieren:
    ```bash
    npm install
    ```
2. `.env` anlegen und `GROQ_API_KEY` setzen.
3. Server starten:
    ```bash
    npm start
    ```
    oder
    ```bash
    ./server.sh restart
    ```
4. App öffnen: `http://localhost:3000`

## Render Deployment (Wichtig)

Wenn auf Render ein Fehler wie `sqlite3 ... invalid ELF header` auftritt, wurde in der Regel ein lokales (z. B. macOS) `node_modules` hochgeladen.

- Stelle sicher, dass `node_modules/` nicht mit deployed wird (siehe `.renderignore`).
- Verwende auf Render als **Build Command**: `npm ci`
- Verwende als **Start Command**: `npm start`
- Fuehre bei bestehendem Fehler einen **Clear build cache + Manual Deploy** in Render aus.

Zusaetzlich erzwingt das Projekt auf Linux automatisch ein `sqlite3`-Rebuild (`postinstall` und `prestart`), um veraltete oder falsche Native-Binaries aus dem Cache zu ersetzen.

So werden native Module wie `sqlite3` auf Linux korrekt installiert.

## Demo-Daten

- Seed-Skript für umfangreiche Demo-Daten: `seed-demo-data.js`
- Ausführung:
  ```bash
  node seed-demo-data.js
  ```

## Roadmap

- Die aktuelle Produkt- und KI-Planung steht in `ROADMAP.md`.

## Credits

- [@loleckerliii](https://github.com/loleckerliii)
- [@Flex6x](https://github.com/Flex6x)
- [@lenadill](https://github.com/lenadill)
- [@lifalinusfalkenberg-bot](https://github.com/lifalinusfalkenberg-bot)
- [@Maxilo92](https://github.com/Maxilo92)

---
Clarity Financial Management Platform · 2026
