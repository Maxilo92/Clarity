# Changelog

All notable changes to this project will be documented in this file.

## [1.4.4] - 2026-03-06
### Fixed
- **Sync Fix (RBAC):** Ein Fehler wurde behoben, durch den der IndexManager aufgrund fehlender Berechtigungs-IDs (`requester_id`) keine Status-Updates vom Server abrufen konnte. Dies führte zu dauerhaften "Out of sync"-Meldungen trotz Reindexing.
- **API Security:** Der Endpunkt für den ID-Abgleich (`/api/transactions/ids`) ist nun ebenfalls durch die `isAdmin`-Middleware geschützt.

## [1.4.3] - 2026-03-06
### Improved
- **Sync Robustness:** Die Synchronisationslogik des IndexManagers wurde gehärtet. Er erkennt nun auch Änderungen, bei denen die Anzahl der Datensätze gleich bleibt, aber Inhalte (IDs) variieren (z.B. gleichzeitiges Löschen und Hinzufügen).
- **Metadata Auto-Correction:** Nach jedem Deletion-Sync werden die lokalen Metadaten (`latest_id`) nun zwingend mit dem Server abgeglichen, um "Out of sync"-Meldungen in den Dev-Tools zu vermeiden.

## [1.4.2] - 2026-03-06
### Fixed
- **Sync Status Consistency:** Ein Anzeigefehler in den Dev-Tools wurde behoben, bei dem der Index fälschlicherweise als "Out of sync" markiert wurde, obwohl die Anzahl der Datensätze übereinstimmte. Die Vergleichslogik ist nun robuster gegenüber Datentyp-Unterschieden bei IDs.
- **Improved Deletion Sync:** Der IndexManager aktualisiert nun nach einer lokalen Bereinigung (Deletion Sync) seine Metadaten direkt vom Server, um sofortige Konsistenz zu gewährleisten.

## [1.4.1] - 2026-03-06
### Improved
- **Smart Incremental Indexing:** Das Indexing-System wurde optimiert, um bei Löschvorgängen keinen vollständigen Rebuild mehr zu benötigen. Ein neuer ID-Sync-Mechanismus erkennt gelöschte Transaktionen auf dem Server und bereinigt den lokalen Index gezielt.
- **Efficient Deletion Tracking:** Neuer API-Endpunkt `/api/transactions/ids` liefert kompakte ID-Listen für performante Integritätschecks.

## [1.4.0] - 2026-03-06
### Added
- **RBAC v1 (Server-Side Security):** Vollständige technische Durchsetzung von Rollenrechten im Backend. Kritische Endpunkte (User-Verwaltung, Audit-Logs, Einladungen, Dev-Tools) sind nun durch eine neue `isAdmin`-Middleware geschützt.
- **Requester Validation:** Alle administrativen API-Calls validieren nun die Identität und Rolle des anfragenden Nutzers (`requester_id`), um unbefugten Zugriff auf Organisationsdaten zu verhindern.
- **Enhanced Category Security:** Das Erstellen, Bearbeiten und Löschen von Kategorien sowie Budget-Anpassungen sind jetzt exklusiv Administratoren vorbehalten.

## [1.3.0] - 2026-03-06
### Added
- **Admin Panel Performance:** Infinite Scroll für die Mitarbeiter- und Audit-Listen implementiert, um auch große Organisationen performant zu verwalten.
- **Advanced Filtering:** Neue Such- und Filterfunktionen für das Audit-Log und die Mitgliederverwaltung.
- **Scalable API:** Unterstützung für Pagination (limit/offset) und serverseitige Suche in den Admin-Endpunkten.

## [1.2.5] - 2026-03-06
### Fixed
- **Startup Issue:** Ein Syntaxfehler im KI-System-Prompt (nicht maskierte Backticks), der den Server-Start verhinderte, wurde behoben.

## [1.2.4] - 2026-03-06
### Added
- **Company Context Profiles:** Administratoren können nun im Admin Panel ein Organisationsprofil bzw. spezifische Regeln hinterlegen (z. B. "Wir sind ein Tech-Startup", "Mittagsbudget beträgt 50€"). Claire liest diesen Kontext bei jeder Anfrage aus und passt ihre Beratung und Analysen an die Unternehmenskultur und -vorgaben an.

## [1.2.3] - 2026-03-06
### Added
- **Multi-Currency Support:** Claire beherrscht nun echte Währungsumrechnungen. Basierend auf den Nutzerpräferenzen werden Finanzdaten in Echtzeit mittels der Frankfurter API (EZB-Daten) umgerechnet. Dies betrifft sowohl die Chat-Zusammenfassungen als auch die detaillierten Spending-Analysen.
- **Currency Caching:** Um die Performance zu optimieren, werden Wechselkurse serverseitig für eine Stunde zwischengespeichert.

## [1.2.2] - 2026-03-06
### Added
- **User Preference Memory:** Nutzer können nun in den Einstellungen ihre bevorzugte Währung, Sprache und den Antwort-Stil (Tonalität) von Claire anpassen. Diese Präferenzen werden dauerhaft gespeichert und fließen direkt in den Kontext der KI-Interaktionen ein.

## [1.2.1] - 2026-03-06
### Improved
- **Intent Router v2:** Der System-Prompt wurde optimiert, um Claire eine klarere Logik für die Werkzeugwahl (Tool Routing) zu geben. Sie unterscheidet nun präziser zwischen Buchungen, Analysen, Filtern und Löschvorgängen.

## [1.2.0] - 2026-03-06
### Added
- **Major Feature Update: Insights & Intelligence:**
  - **Category Assistant (Preview):** Vorbereitungen für intelligente Kategorie-Vorschläge.
  - **Smart Alerts:** Proaktive Warnungen bei Budgetüberschreitungen und Preisänderungen von Abos.
  - **Explainability:** Detaillierte Begründungen für Finanz-Prognosen (Trends, Saisonalität).
  - **Budget Coach:** Claire gibt nun proaktive Spartipps basierend auf der Budget-Auslastung.
  - **Anomaly Explainer:** Automatischer Vergleich zum Vormonat mit Ursachenanalyse bei starken Abweichungen.
  - **Subscription Intelligence:** Verbesserte Erkennung variabler Abos und flexibler Intervalle.
  - **Audit Logging:** Vollständige Traceability aller kritischen Aktionen (Transaktionen, Kategorien, KI-Aktionen).
  - **Fallback Chain:** Erhöhte Ausfallsicherheit der KI durch automatische Modell-Wechsel.

## [1.1.58] - 2026-03-06

### Added
- **Audit Logging (Traceability):** Ein umfassendes Audit-Log-System wurde implementiert. Alle kritischen Aktionen (Hinzufügen/Löschen von Transaktionen, Budget-Anpassungen, Kategorie-Änderungen) werden nun mit Zeitstempel, Benutzer-ID und Details protokolliert.
- **Admin Audit UI:** Administratoren können die letzten Aktivitäten der Organisation nun direkt im Admin Panel einsehen, was für mehr Transparenz und Sicherheit sorgt.
- **AI Action Tracking:** Auch von Claire (KI) initiierte Aktionen werden im Audit-Log speziell markiert (`ADD_TRANSACTION_AI`).

## [1.1.53] - 2026-03-06
### Added
- **Developer Tools: Consistency Scan:** Ein neues Tool ("Konsistenzscan") wurde dem Dev-Tools-Bereich hinzugefügt. Administratoren können nun die Datenbank auf fehlerhafte Einträge prüfen (fehlende Kategorien, 0-Euro Beträge, Transaktionen in der Zukunft), um eine hohe Datenqualität für die KI und Insights-Berechnungen sicherzustellen.

## [1.1.52] - 2026-03-06
### Added
- **Smart Alerts:** Die Insights-Seite wurde um einen "Smart Alerts"-Bereich erweitert. Dieser informiert den Nutzer proaktiv über Preiserhöhungen bei erkannten Abonnements und warnt bei Überschreitung (oder nahendem Limit) der gesetzten Monatsbudgets.

## [1.1.51] - 2026-03-06
### Added
- **Fallback Chain:** Es wurde ein Fallback-Mechanismus für die KI-Modelle implementiert (z. B. `llama-3.3-70b-versatile` -> `llama-3.1-8b-instant` -> `mixtral-8x7b-32768`), um Ausfallzeiten der API oder Limitierungen automatisch abzufangen und eine höhere Zuverlässigkeit von Claire zu gewährleisten.

## [1.1.50] - 2026-03-06
### Added
- **Tool Guardrails & Reliability:** Striktere Validierung für das Hinzufügen von Transaktionen (Betrag darf nicht 0 sein, Kategorie ist Pflicht).
- **Smart Date Parsing:** Claire versteht nun relative Datumsangaben wie "heute", "gestern" oder "yesterday" beim Buchen von Transaktionen.
- **Improved Tool Feedback:** Alle KI-Tools liefern nun detaillierte Erfolgs-Zusammenfassungen zurück, was Claire ermöglicht, präzisere und natürlichere Bestätigungen zu geben.

## [1.1.49] - 2026-03-06
### Fixed
- **Spending Analysis Tool:** Das Tool `get_spending_analysis` wurde im Backend implementiert. Claire kann nun detaillierte Berichte für den aktuellen Monat, das laufende Jahr oder den gesamten Zeitraum erstellen, indem sie aggregierte Statistiken aus der Datenbank abruft.

## [1.1.48] - 2026-03-06
### Fixed
- **Stable AI Streaming:** Die Streaming-Logik wurde sowohl im Frontend als auch im Backend grundlegend überarbeitet. Ein Puffer-System verhindert nun Datenverlust bei zerstückelten Paketen, und Claire zeigt keine leeren Sprechblasen mehr an.
- **AI Feedback Guarantee:** Claire gibt nun immer eine verbale Bestätigung oder einen Status-Text (z. B. "Ich bereite die Löschung vor..."), selbst wenn die KI-Antwort primär aus technischen Tool-Befehlen besteht.
- **Reliable Tool Execution:** Die Erkennung und Ausführung von Transaktions-Löschungen und Dashboard-Filtern nach dem Stream-Ende wurde stabilisiert.

## [1.1.47] - 2026-03-05
### Added
- **Real-Time Streaming:** Claire antwortet nun in Echtzeit. Der Text erscheint Wort für Wort, genau in der Geschwindigkeit, in der die KI ihn generiert, was für eine natürlichere Konversation sorgt.
- **Bulk Deletion UI:** Mehrere Transaktionen können nun gleichzeitig gelöscht werden. Das System zeigt eine einzige, gesammelte Bestätigungsabfrage für alle betroffenen Posten an.

## [1.1.46] - 2026-03-05
### Fixed
- **Server Stability:** Das Timeout für KI-Anfragen wurde auf 45s erhöht, um komplexe Operationen zuverlässig zu verarbeiten.
- **Transaction Context:** Claire sieht nun die IDs von Transaktionen im Kontext, was präzise Löschvorgänge ermöglicht.

## [1.1.45] - 2026-03-05
### Added
- **AI Tool Transparency:** Nachrichten mit KI-Aktionen erhalten nun Info-Tags. Beim Hovern zeigt ein Tooltip die exakten verwendeten Daten an.
- **Confidence Intervals:** Der Dashboard-Graph visualisiert nun statistische Unsicherheiten als schattierte Bereiche um die Forecast-Linien.

## [1.1.44] - 2026-03-05
### Fixed
- **Data Integrity:** Validierung verhindert NaN-Beträge in der Datenbank.
- **UI Scaling:** Beträge in Dashboard-Karten werden bei Platzmangel nun sauber mit "..." gekürzt statt abgeschnitten.

... (ältere Einträge gekürzt)
