# Clarity Roadmap

## Q2 2026 – Stabilität & Datenqualität
- Sidebar/Navigation final härten (Cross-Page UI-Tests, keine Active-State-Regressionen).
- Demo-/Seed-Management verbessern (resettable Demo-Daten, Szenario-Presets für Sales/Demos).
- Performance-Baseline für Dashboard, Insights und Search (Ladezeiten, API-Response, Cache-Hit-Rate).
- **KPI:** < 2s First Dashboard Load, 0 kritische UI-Bugs pro Release.

### Konkrete Deliverables (Q2)
- `Sidebar Hardening`: Einheitliche Active-State-Logik, Template-Validierung, Navigation-Smoke-Test über alle Kernseiten.
- `Demo Data Lifecycle`: Seed/Reset-Skripte für realistische Demo-Szenarien (Startup, KMU, Agentur) inkl. Datenkonsistenz-Checks.
- `Performance Baseline`: Messpunkte für TTFB, API-Dauer (`/api/transactions`, `/api/chat`), Rendering-Zeit Dashboard.
- `Regression Safety Net`: Leichte E2E-Checks für Login → Dashboard → Insights → Settings → Admin.

### Meilensteine (Q2)
- **M1 (April):** Navigation + Admin-Sidebar stabil und konsistent.
- **M2 (Mai):** Seed-/Reset-Flow produktiv für Demos nutzbar.
- **M3 (Juni):** Performance-Baseline dokumentiert und erste Optimierungen live.

## Q3 2026 – Insights & KI-Mehrwert
- Financial Insights erweitern: Budget-vs-Ist, Trend-Alerts, Forecast-Erklärbarkeit.
- Clair verbessern: robustere Tool-Auswahl, Eingabevalidierung, transparentes Aktions-Feedback.
- Smart Tags für Transaktionen (Abo, einmalig, ungewöhnlich, saisonal).
- **KPI:** +30% Nutzung der Insights-Page, +20% erfolgreiche KI-Aktionen ohne manuelle Korrektur.
- **Clair-KPI-Set:** Tool-Call Success Rate > 95%, Halluzinationsquote < 2%, mediane Antwortzeit < 2.5s.

### Konkrete Deliverables (Q3)
- `Budgeting MVP`: Monatliche Budget-Definition je Kategorie + Ampelstatus (unter Budget / nah am Limit / über Budget).
- `Alerting`: Hinweise bei Ausreißern, ungewöhnlichen Mustern und Abo-Preisänderungen.
- `Clair Reliability`: Verbesserte Tool-Entscheidung, klarere Rückmeldungen nach Aktionen, bessere Fallbacks bei Parsing.
- `Explainability`: Kurze, verständliche Begründung zu Forecast- und Insight-Aussagen.

### Meilensteine (Q3)
- **M1 (Juli):** Budget-vs-Ist in Insights verfügbar.
- **M2 (August):** Alerting-Regeln ausgerollt.
- **M3 (September):** Clair-Qualität messbar verbessert (Success-Rate + Nutzerfeedback).

## Claire/Clair Upgrade-Programm (Erweitert)

### Upgrade Paket A – Reliability & Tooling (Q3 2026)
- `Intent Router v2`: bessere Absichtserkennung (Buchen, Filtern, Analysieren, Erklären).
- `Tool Guardrails`: striktere Validierung für Betrag, Kategorie, Datum, Sender/Empfänger.
- `Fallback Chain`: definierte Fallback-Modelle + robuste Fehlerbehandlung bei API-/Tool-Fehlern.
- `Action Confirmation`: eindeutige Erfolgs-/Fehlermeldungen nach jedem Tool-Write.
- **Abnahmekriterium:** >95% erfolgreiche Tool-Aufrufe bei Standard-Use-Cases.

### Upgrade Paket B – Domain Skills & Finance IQ (Q3–Q4 2026)
- `Budget Coach`: proaktive Hinweise bei Budgetüberschreitungen mit konkreten Vorschlägen.
- `Anomaly Explainer`: erklärt Ausreißer inkl. Vergleich zu Vorperioden.
- `Subscription Intelligence`: bessere Erkennung variabler Abo-Preise und Frequenzen.
- `Category Assistant`: Vorschläge für fehlende/unklare Kategorien mit Confidence Score.
- **Abnahmekriterium:** spürbar weniger manuelle Korrekturen bei Buchungen/Insights.

### Upgrade Paket C – Memory & Personalization (Q4 2026)
- `User Preference Memory`: merkt sich bevorzugte Formulierungen, Währung, Kontexttiefe.
- `Company Context Profiles`: Unternehmenskontext für passgenauere Antworten pro Tenant.
- `Conversation Continuity`: bessere Anschlussfähigkeit über mehrere Chat-Turns hinweg.
- `Attachment-Aware Reasoning`: sauberer Umgang mit angehängten Transaktionen/Belegen.
- **Abnahmekriterium:** höhere Nutzerzufriedenheit bei wiederkehrenden Tasks.

### Upgrade Paket D – Safety, Governance & Trust (Q4 2026 – Q1 2027)
- `Prompt Hardening`: Schutz gegen Prompt Injection und missbräuchliche Tool-Nutzung.
- `Data Access Policies`: KI-Antworten strikt auf berechtigte Datenbereiche begrenzen.
- `Auditability`: Tool-Aktionen mit Grund, Input und Outcome nachvollziehbar loggen.
- `Policy Layer`: klare Antwortregeln für sensible Finanz- und Admin-Aktionen.
- **Abnahmekriterium:** 0 kritische Sicherheitsvorfälle durch KI-Interaktion.

### Upgrade Paket E – Observability & Continuous Improvement (ab Q1 2027)
- `AI Quality Dashboard`: Success Rate, Time-to-Answer, Fallback-Rate, Undo-Rate.
- `Feedback Loop`: direktes User-Feedback in Priorisierung/Prompt-Tuning integrieren.
- `Eval Suite`: Regressionstests für typische Finanzdialoge und Tool-Flows.
- `Release Gates`: KI-Changes nur mit bestandenen Evals + KPI-Mindestwerten.
- **Abnahmekriterium:** stabile Qualitätssteigerung über mehrere Releases.

## Q4 2026 – Team- & Admin-Funktionen
- Rollenmodell ausbauen (Admin, Manager, User mit feineren Rechten).
- Audit-Log für Änderungen (Transaktionen, Kategorien, User-Aktionen).
- Dev-Tools erweitern (Health-Checks, Reindex/Repair, Datenintegrität-Checks).
- **KPI:** 100% nachvollziehbare Admin-Änderungen, < 5 Min Mean Time to Diagnose bei Datenproblemen.

### Konkrete Deliverables (Q4)
- `RBAC v1`: Rollenrechte pro Bereich (Datenpflege, Userverwaltung, Dev-Tools, Insights-Konfiguration).
- `Audit Log`: Wer hat wann was geändert (inkl. Vorher/Nachher bei kritischen Änderungen).
- `Ops Toolkit`: Index-Status, Reindex, Konsistenzscan, einfache Reparatur-Workflows im Dev-Tools-Bereich.
- `Admin UX`: Klare Fehlertexte und Schutzmechanismen bei risikoreichen Aktionen.

### Meilensteine (Q4)
- **M1 (Oktober):** Rollenmatrix technisch durchgesetzt.
- **M2 (November):** Audit-Trail vollständig für Kernobjekte.
- **M3 (Dezember):** Dev-Tools-Diagnose-Flow produktionsreif.

## Q1 2027 – Produktreife & Skalierung
- API-Härtung (Rate Limits, bessere Fehlercodes, Monitoring/Alerting).
- Multi-Company-Skalierung optimieren (DB-Wartung, Backup/Restore, Migrationstools).
- Release-Prozess standardisieren (Versioning, Changelog-Qualität, Smoke-Tests).
- **KPI:** 99.9% Uptime im Demo-/Pilotbetrieb, planbare Releases ohne Hotfix-Dringlichkeit.

### Konkrete Deliverables (Q1)
- `API Reliability`: Standardisierte Fehlerobjekte, Timeouts, Retry-Strategien und Monitoring-Dashboards.
- `Tenant Operations`: Backup/Restore-Runbook pro Company-DB, Wartungsjobs und einfache Migrationspfade.
- `Release Discipline`: Fester Release-Kalender, Definition of Done inkl. Tests/Changelog/Version-Bump.
- `Operational Readiness`: On-call-Light Prozess für kritische Incidents.

### Meilensteine (Q1)
- **M1 (Januar):** Monitoring + Alerting auf kritischen Endpunkten aktiv.
- **M2 (Februar):** Tenant-Backup/Restore verifiziert.
- **M3 (März):** Release-Flow stabil mit planbaren Deployments.

## Q2 2027 – Wachstum & Integrationen
- CSV/Bank-Import (MVP) für schnellere Datenaufnahme.
- Export für Reporting (CSV/PDF) für Admin und Management.
- Erste Integrationsschnittstellen (z. B. standardisierte Webhook-Events).
- **KPI:** 40% schnellere Ersteinrichtung neuer Accounts, signifikant weniger manuelle Dateneingaben.

### Meilensteine (Q2 2027)
- **M1:** CSV-Import mit Validierung und Fehlerreport.
- **M2:** Report-Export für Monats- und Kategorieauswertung.
- **M3:** Erste externe Integrations-Use-Cases im Pilotbetrieb.

## Durchgehende Leitplanken
- Security first: Passwort-, Session- und Rollen-Absicherung.
- UX-Konsistenz: einheitliche Navigation, klare Zustände, keine überraschenden UI-Wechsel.
- Messbarkeit: Jede größere Funktion bekommt 1–2 klare Erfolgsmetriken.
- `Clair-by-default`: Jede neue Kernfunktion bekommt einen definierten Clair-Use-Case (mind. lesen, optional schreiben).

## Abhängigkeiten & Risiken

### Abhängigkeiten
- Stabile Datenbasis (konsistente Kategorien, saubere Timestamps, reproduzierbare Demo-Daten).
- Verlässliche KI-Toolkette (`/api/chat`, Tool Calls, DB-Schreibprozesse).
- Klare Ownership für Frontend, Backend, Datenmodell und Qualitätssicherung.

### Hauptrisiken
- **Scope Drift:** Zu viele parallele Features ohne harte Priorisierung.
- **Tech Debt:** Schnell implementierte Workarounds bei Navigation/Template-Struktur.
- **KI-Unschärfen:** Unklare oder inkonsistente Tool-Antworten bei Randfällen.
- **Datenqualität:** Uneinheitliche Demo-/Produktionsdaten verfälschen Insights.

### Gegenmaßnahmen
- Quartalsziele in MVP/Should/Nice-to-have trennen.
- Definition of Done erweitern: UI-Konsistenz, Versionsupdate, Changelog-Pflicht.
- Monatlicher Quality Gate Review (Fehlerquote, Regressionsstatus, Performance).

## Delivery-Rhythmus
- **Wöchentlich:** Priorisierung, Bug-Triage, KPI-Check.
- **Zweiwöchentlich:** Sprint-Review + Roadmap-Check-in.
- **Monatlich:** Stabilitätsbericht (Performance, Fehlerklassen, KI-Qualität).
- **Quartalsweise:** Roadmap-Rekalibrierung auf Basis von KPI und Nutzerfeedback.
- **Monatlich (Clair):** Prompt/Tool Review, Eval-Run, Safety-Review, KPI-Abgleich.

## Nächster Schritt
- Execution-Plan für die nächsten 6 Wochen mit konkreten Tickets (MVP / Should / Nice-to-have) erstellen.
