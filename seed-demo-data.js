/**
 * Clarity Demo Data Seed Script
 * Generates 1000 realistic, diverse financial transactions
 * covering all categories, users, and timeframes (Jan 2025 – Feb 2026).
 *
 * Run: node seed-demo-data.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'App', 'db', 'company_1.db');
const db = new sqlite3.Database(DB_PATH);

// ─── Users ───────────────────────────────────────────────
const USERS = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Max' },
    { id: 3, name: 'Sarah' }
];

// ─── Category Templates ──────────────────────────────────
// Each entry: { name, sender, empfaenger, beschreibung, wertRange:[min,max] }
// wert is NEGATIVE for expenses, POSITIVE for income.

const FOOD = [
    { name: 'REWE Wocheneinkauf', empfaenger: 'REWE', beschreibung: 'Lebensmittel für die Woche', wert: [-85, -35] },
    { name: 'ALDI Einkauf', empfaenger: 'ALDI Süd', beschreibung: 'Grundnahrungsmittel und Snacks', wert: [-65, -18] },
    { name: 'EDEKA Supermarkt', empfaenger: 'EDEKA', beschreibung: 'Frisches Obst, Gemüse und Milchprodukte', wert: [-95, -25] },
    { name: 'Lidl Einkauf', empfaenger: 'Lidl', beschreibung: 'Günstige Lebensmittel und Haushaltswaren', wert: [-55, -12] },
    { name: 'Bäckerei Müller', empfaenger: 'Bäckerei Müller', beschreibung: 'Brötchen, Brot und Gebäck', wert: [-12, -3] },
    { name: 'Starbucks Kaffee', empfaenger: 'Starbucks', beschreibung: 'Cappuccino und Snack', wert: [-9, -4] },
    { name: 'Restaurant Il Palazzo', empfaenger: 'Il Palazzo', beschreibung: 'Italienisches Abendessen', wert: [-55, -22] },
    { name: 'Sushi Express', empfaenger: 'Sushi Express', beschreibung: 'Sushi-Bestellung zum Mitnehmen', wert: [-35, -15] },
    { name: 'Döner Kebab', empfaenger: 'Döner King', beschreibung: 'Döner mit allem und Getränk', wert: [-9, -5] },
    { name: 'Lieferando Bestellung', empfaenger: 'Lieferando', beschreibung: 'Essenslieferung nach Hause', wert: [-32, -12] },
    { name: 'McDonald\'s', empfaenger: 'McDonald\'s', beschreibung: 'Big Mac Menü', wert: [-12, -6] },
    { name: 'Burger King', empfaenger: 'Burger King', beschreibung: 'Whopper Menü und Nachtisch', wert: [-14, -7] },
    { name: 'Asia Imbiss', empfaenger: 'Asia Wok', beschreibung: 'Gebratene Nudeln mit Gemüse', wert: [-11, -6] },
    { name: 'Metzgerei Weber', empfaenger: 'Metzgerei Weber', beschreibung: 'Wurst und Aufschnitt', wert: [-18, -8] },
    { name: 'Bio-Markt Einkauf', empfaenger: 'Alnatura', beschreibung: 'Bio-Lebensmittel und Naturkosmetik', wert: [-75, -20] },
    { name: 'Café Crème', empfaenger: 'Café Crème', beschreibung: 'Kaffee und Kuchen am Nachmittag', wert: [-14, -5] },
    { name: 'Penny Einkauf', empfaenger: 'Penny', beschreibung: 'Discounter-Einkauf', wert: [-45, -10] },
    { name: 'Netto Marken-Discount', empfaenger: 'Netto', beschreibung: 'Günstige Wocheneinkäufe', wert: [-40, -12] },
    { name: 'Subway Sandwich', empfaenger: 'Subway', beschreibung: 'Sub des Tages mit Getränk', wert: [-10, -5] },
    { name: 'Pizza Hut', empfaenger: 'Pizza Hut', beschreibung: 'Familienpizza zum Mitnehmen', wert: [-28, -12] },
    { name: 'Eisdiele am Markt', empfaenger: 'Eiscafé Venezia', beschreibung: 'Eis und Waffeln', wert: [-8, -3] },
    { name: 'dm Snacks', empfaenger: 'dm Drogerie', beschreibung: 'Bio-Riegel und Trockenfrüchte', wert: [-12, -4] },
    { name: 'Nespresso Kapseln', empfaenger: 'Nespresso', beschreibung: 'Kaffeekapseln Nachbestellung', wert: [-38, -18] },
    { name: 'Wochenmarkt Einkauf', empfaenger: 'Wochenmarkt', beschreibung: 'Frische regionale Produkte vom Markt', wert: [-42, -15] },
    { name: 'Vapiano Pasta', empfaenger: 'Vapiano', beschreibung: 'Pasta und Getränk im Restaurant', wert: [-22, -12] },
];

const HOUSING = [
    { name: 'Miete Februar', empfaenger: 'Hausverwaltung Schmidt', beschreibung: 'Monatliche Kaltmiete', wert: [-1200, -650] },
    { name: 'Nebenkosten', empfaenger: 'Hausverwaltung Schmidt', beschreibung: 'Monatliche Nebenkostenvorauszahlung', wert: [-280, -120] },
    { name: 'Stromrechnung', empfaenger: 'Stadtwerke München', beschreibung: 'Monatlicher Stromabschlag', wert: [-95, -45] },
    { name: 'Gasrechnung', empfaenger: 'Stadtwerke München', beschreibung: 'Monatlicher Gasabschlag', wert: [-120, -55] },
    { name: 'Internetanschluss', empfaenger: 'Telekom', beschreibung: 'Glasfaser 250 Mbit/s', wert: [-50, -30] },
    { name: 'GEZ Rundfunkbeitrag', empfaenger: 'ARD ZDF', beschreibung: 'Quartalsweise Rundfunkgebühr', wert: [-55, -55] },
    { name: 'Hausratversicherung', empfaenger: 'Allianz', beschreibung: 'Jährliche Hausratversicherung', wert: [-180, -80] },
    { name: 'Wasserrechnung', empfaenger: 'Stadtwerke', beschreibung: 'Wasserverbrauch Quartal', wert: [-75, -35] },
    { name: 'IKEA Möbel', empfaenger: 'IKEA', beschreibung: 'Neues Bücherregal und Deko', wert: [-250, -35] },
    { name: 'Bauhaus Renovierung', empfaenger: 'Bauhaus', beschreibung: 'Farbe, Pinsel und Zubehör', wert: [-85, -25] },
    { name: 'Schlüsseldienst', empfaenger: 'Schlüsseldienst Maier', beschreibung: 'Notöffnung Wohnungstür', wert: [-180, -85] },
    { name: 'Schornsteinfeger', empfaenger: 'Schornsteinfeger GmbH', beschreibung: 'Jährliche Schornsteinreinigung', wert: [-80, -45] },
    { name: 'Wohngebäudeversicherung', empfaenger: 'HUK-COBURG', beschreibung: 'Jährliche Gebäudeversicherung', wert: [-350, -150] },
    { name: 'Heizungswartung', empfaenger: 'Heizung Scholz', beschreibung: 'Jährliche Heizungsinspektion', wert: [-160, -90] },
    { name: 'Müllgebühren', empfaenger: 'Stadtverwaltung', beschreibung: 'Quartalsweise Müllentsorgung', wert: [-65, -30] },
];

const TRANSPORTATION = [
    { name: 'Tankstelle Shell', empfaenger: 'Shell', beschreibung: 'Tankfüllung Super E10', wert: [-85, -40] },
    { name: 'Tankstelle Aral', empfaenger: 'Aral', beschreibung: 'Diesel tanken', wert: [-90, -45] },
    { name: 'DB Monatskarte', empfaenger: 'Deutsche Bahn', beschreibung: 'Monatsticket Regionalverkehr', wert: [-89, -49] },
    { name: 'Deutschlandticket', empfaenger: 'ADAC/Bahn', beschreibung: '49€ Ticket ÖPNV', wert: [-49, -49] },
    { name: 'BVG Einzelfahrschein', empfaenger: 'BVG', beschreibung: 'Einzelfahrt U-Bahn Berlin', wert: [-3.5, -3.0] },
    { name: 'Uber Fahrt', empfaenger: 'Uber', beschreibung: 'Fahrt zum Flughafen', wert: [-45, -12] },
    { name: 'ADAC Mitgliedschaft', empfaenger: 'ADAC', beschreibung: 'Jährliche ADAC Plus-Mitgliedschaft', wert: [-120, -60] },
    { name: 'KFZ-Versicherung', empfaenger: 'HUK-COBURG', beschreibung: 'Monatliche KFZ-Haftpflicht und Teilkasko', wert: [-95, -45] },
    { name: 'KFZ-Steuer', empfaenger: 'Finanzverwaltung', beschreibung: 'Jährliche Kraftfahrzeugsteuer', wert: [-180, -80] },
    { name: 'TÜV Hauptuntersuchung', empfaenger: 'TÜV Süd', beschreibung: 'HU und AU Prüfung', wert: [-130, -100] },
    { name: 'Reifenwechsel', empfaenger: 'ATU', beschreibung: 'Winterreifen aufziehen lassen', wert: [-120, -40] },
    { name: 'Parkgebühren', empfaenger: 'Parkhaus City', beschreibung: 'Tagesticket Innenstadt', wert: [-18, -4] },
    { name: 'Flixbus Fernreise', empfaenger: 'Flixbus', beschreibung: 'Fernbus München-Berlin', wert: [-45, -15] },
    { name: 'E-Scooter Lime', empfaenger: 'Lime', beschreibung: 'E-Scooter Einzelfahrt', wert: [-5, -2] },
    { name: 'DB ICE Fernverkehr', empfaenger: 'Deutsche Bahn', beschreibung: 'ICE Ticket nach Hamburg', wert: [-120, -35] },
    { name: 'Autowäsche', empfaenger: 'Mr. Wash', beschreibung: 'Premiumwäsche mit Innenreinigung', wert: [-25, -8] },
    { name: 'Werkstatt Inspektion', empfaenger: 'ATU', beschreibung: 'Große Inspektion 60.000km', wert: [-450, -150] },
    { name: 'Fahrradreparatur', empfaenger: 'Fahrrad Müller', beschreibung: 'Bremsen und Kette erneuert', wert: [-85, -25] },
    { name: 'Mietwagen Europcar', empfaenger: 'Europcar', beschreibung: 'Mietwagen für Wochenendausflug', wert: [-120, -55] },
    { name: 'Taxi zum Bahnhof', empfaenger: 'Taxi München', beschreibung: 'Taxifahrt vom Hotel zum Bahnhof', wert: [-25, -10] },
];

const LEISURE = [
    { name: 'Netflix Abo', empfaenger: 'Netflix', beschreibung: 'Monatliches Streaming-Abo Standard', wert: [-13, -13] },
    { name: 'Spotify Premium', empfaenger: 'Spotify', beschreibung: 'Musik-Streaming Einzelabo', wert: [-10, -10] },
    { name: 'Disney+ Abo', empfaenger: 'Disney+', beschreibung: 'Monatliches Disney Plus Abo', wert: [-9, -9] },
    { name: 'Amazon Prime', empfaenger: 'Amazon', beschreibung: 'Jährliche Prime-Mitgliedschaft', wert: [-90, -90] },
    { name: 'Kino CinemaxX', empfaenger: 'CinemaxX', beschreibung: '2 Tickets inkl. Popcorn', wert: [-35, -15] },
    { name: 'Fitnessstudio', empfaenger: 'McFit', beschreibung: 'Monatlicher Mitgliedsbeitrag', wert: [-35, -20] },
    { name: 'Konzertticket', empfaenger: 'Eventim', beschreibung: 'Konzertbesuch in der Arena', wert: [-120, -35] },
    { name: 'Buchhandlung Thalia', empfaenger: 'Thalia', beschreibung: 'Neue Bücher und Bestseller', wert: [-45, -10] },
    { name: 'PlayStation Store', empfaenger: 'Sony', beschreibung: 'Neues PS5-Spiel gekauft', wert: [-70, -15] },
    { name: 'Steam Spiel', empfaenger: 'Steam/Valve', beschreibung: 'PC-Spiel im Sale gekauft', wert: [-45, -5] },
    { name: 'Bowling Abend', empfaenger: 'Bowlingcenter', beschreibung: 'Bowling mit Freunden', wert: [-25, -12] },
    { name: 'Schwimmbad Therme', empfaenger: 'Therme Erding', beschreibung: 'Tageskarte Therme', wert: [-45, -18] },
    { name: 'Zoo Besuch', empfaenger: 'Tierpark Hellabrunn', beschreibung: 'Familienkarte Tierpark', wert: [-35, -12] },
    { name: 'Museum Eintritt', empfaenger: 'Deutsches Museum', beschreibung: 'Eintritt und Audioguide', wert: [-16, -8] },
    { name: 'Escape Room', empfaenger: 'Escape Room München', beschreibung: 'Team-Erlebnis für 4 Personen', wert: [-100, -50] },
    { name: 'Kletterhalle', empfaenger: 'DAV Kletterzentrum', beschreibung: 'Tageskarte Klettern', wert: [-18, -12] },
    { name: 'YouTube Premium', empfaenger: 'Google', beschreibung: 'Monatliches YT Premium Abo', wert: [-12, -12] },
    { name: 'Audible Hörbuch', empfaenger: 'Audible/Amazon', beschreibung: 'Monatliches Hörbuch-Guthaben', wert: [-10, -10] },
    { name: 'Freizeitpark', empfaenger: 'Europa-Park', beschreibung: 'Tageskarte Europa-Park Rust', wert: [-60, -55] },
    { name: 'Minigolf', empfaenger: 'Minigolfanlage', beschreibung: 'Minigolf mit der Familie', wert: [-15, -6] },
    { name: 'Theaterkarte', empfaenger: 'Staatstheater', beschreibung: 'Vorstellung Abendprogramm', wert: [-55, -25] },
    { name: 'Skipass Tagesticket', empfaenger: 'Skigebiet Garmisch', beschreibung: 'Skipass inkl. Leihausrüstung', wert: [-85, -45] },
];

const SHOPPING = [
    { name: 'Amazon Bestellung', empfaenger: 'Amazon', beschreibung: 'Diverse Artikel bestellt', wert: [-120, -10] },
    { name: 'Zalando Mode', empfaenger: 'Zalando', beschreibung: 'Neue Kleidung und Schuhe', wert: [-150, -25] },
    { name: 'H&M Kleidung', empfaenger: 'H&M', beschreibung: 'T-Shirts und Hosen', wert: [-80, -15] },
    { name: 'MediaMarkt Elektronik', empfaenger: 'MediaMarkt', beschreibung: 'Elektronikzubehör', wert: [-250, -15] },
    { name: 'Apple Store', empfaenger: 'Apple', beschreibung: 'AirPods Pro / Zubehör', wert: [-280, -30] },
    { name: 'dm Drogerie', empfaenger: 'dm', beschreibung: 'Pflegeprodukte und Hygieneartikel', wert: [-35, -8] },
    { name: 'Rossmann Drogerie', empfaenger: 'Rossmann', beschreibung: 'Duschgel, Shampoo, Zahnpasta', wert: [-28, -6] },
    { name: 'Saturn Technik', empfaenger: 'Saturn', beschreibung: 'Neue Computermaus und Tastatur', wert: [-85, -15] },
    { name: 'ZARA Bekleidung', empfaenger: 'ZARA', beschreibung: 'Winterjacke und Accessoires', wert: [-120, -30] },
    { name: 'Decathlon Sport', empfaenger: 'Decathlon', beschreibung: 'Sportbekleidung und Equipment', wert: [-95, -15] },
    { name: 'Douglas Parfümerie', empfaenger: 'Douglas', beschreibung: 'Parfüm und Kosmetik', wert: [-85, -20] },
    { name: 'OTTO Versand', empfaenger: 'OTTO', beschreibung: 'Haushaltswaren bestellt', wert: [-110, -20] },
    { name: 'C&A Kleidung', empfaenger: 'C&A', beschreibung: 'Basics und Unterwäsche', wert: [-50, -15] },
    { name: 'Deichmann Schuhe', empfaenger: 'Deichmann', beschreibung: 'Neue Winterstiefel', wert: [-75, -25] },
    { name: 'Tchibo Angebote', empfaenger: 'Tchibo', beschreibung: 'Wochenangebote und Kaffee', wert: [-40, -10] },
    { name: 'Müller Drogerie', empfaenger: 'Müller', beschreibung: 'Spielwaren und Geschenkartikel', wert: [-45, -8] },
    { name: 'Thalia Bücher', empfaenger: 'Thalia', beschreibung: 'Fachbücher für die Arbeit', wert: [-55, -12] },
    { name: 'IKEA Haushalt', empfaenger: 'IKEA', beschreibung: 'Küchenutensilien und Kerzen', wert: [-65, -10] },
    { name: 'Nike Sneaker', empfaenger: 'Nike Store', beschreibung: 'Laufschuhe Nike Air Max', wert: [-160, -80] },
    { name: 'Brillen Fielmann', empfaenger: 'Fielmann', beschreibung: 'Neue Brille mit Gläsern', wert: [-250, -80] },
    { name: 'Weihnachtsgeschenke', empfaenger: 'Diverse Shops', beschreibung: 'Geschenke für Familie und Freunde', wert: [-200, -50] },
    { name: 'Geburtstagsgeschenk', empfaenger: 'Geschenkeshop', beschreibung: 'Geschenk für Freund/Freundin', wert: [-60, -20] },
];

const HEALTH = [
    { name: 'Apotheke Medikamente', empfaenger: 'Stadt-Apotheke', beschreibung: 'Rezeptfreie Medikamente', wert: [-35, -5] },
    { name: 'Zahnarzt Behandlung', empfaenger: 'Dr. Müller Zahnarzt', beschreibung: 'Professionelle Zahnreinigung', wert: [-120, -50] },
    { name: 'Hausarzt Besuch', empfaenger: 'Dr. Weber Allgemeinmedizin', beschreibung: 'Praxisgebühr und Rezepte', wert: [-30, -10] },
    { name: 'Augenarzt', empfaenger: 'Dr. Klein Augenheilkunde', beschreibung: 'Vorsorgeuntersuchung Augen', wert: [-45, -15] },
    { name: 'Krankenversicherung', empfaenger: 'TK Krankenkasse', beschreibung: 'Monatlicher Zusatzbeitrag', wert: [-250, -80] },
    { name: 'Kontaktlinsen', empfaenger: 'Apollo Optik', beschreibung: 'Monatliche Kontaktlinsen 6er-Pack', wert: [-35, -18] },
    { name: 'Nahrungsergänzung', empfaenger: 'nu3', beschreibung: 'Vitamin D, Omega-3, Magnesium', wert: [-45, -15] },
    { name: 'Physiotherapie', empfaenger: 'Physio Zentrum', beschreibung: 'Krankengymnastik 6 Sitzungen', wert: [-180, -30] },
    { name: 'Impfung', empfaenger: 'Impfzentrum', beschreibung: 'Grippeimpfung / Auffrischung', wert: [-25, -10] },
    { name: 'Psychologe', empfaenger: 'Praxis Dr. Bauer', beschreibung: 'Therapiesitzung (Zuzahlung)', wert: [-80, -15] },
    { name: 'Blutuntersuchung', empfaenger: 'Labor Diagnose GmbH', beschreibung: 'Großes Blutbild', wert: [-65, -25] },
    { name: 'Dermatologe', empfaenger: 'Hautklinik Dr. Scholz', beschreibung: 'Hautkrebsvorsorge', wert: [-45, -20] },
    { name: 'Notaufnahme', empfaenger: 'Klinikum München', beschreibung: 'Notfallbehandlung am Wochenende', wert: [-120, -30] },
    { name: 'Orthopäde', empfaenger: 'Dr. Frank Orthopädie', beschreibung: 'Rückenuntersuchung und Einlagen', wert: [-90, -30] },
    { name: 'Massagebehandlung', empfaenger: 'Wellness & Massage', beschreibung: 'Sportmassage 60 Minuten', wert: [-75, -40] },
];

const INCOME = [
    { name: 'Gehalt', sender: 'SAP SE', beschreibung: 'Monatliches Bruttogehalt', wert: [2800, 5500] },
    { name: 'Freelance Projekt', sender: 'Weber Consulting', beschreibung: 'Honorar für Webentwicklung', wert: [500, 3000] },
    { name: 'Bonus Quartal', sender: 'SAP SE', beschreibung: 'Quartalsbonus Q-Performance', wert: [800, 3500] },
    { name: 'Kindergeld', sender: 'Familienkasse', beschreibung: 'Monatliches Kindergeld', wert: [250, 250] },
    { name: 'Steuererstattung', sender: 'Finanzamt München', beschreibung: 'Einkommensteuererückzahlung', wert: [350, 2200] },
    { name: 'eBay Verkauf', sender: 'eBay Käufer', beschreibung: 'Gebrauchte Elektronik verkauft', wert: [25, 350] },
    { name: 'Dividende Aktien', sender: 'Trade Republic', beschreibung: 'Quartalsdividende ETF-Portfolio', wert: [15, 180] },
    { name: 'Zinsen Sparkonto', sender: 'ING DiBa', beschreibung: 'Tagesgeld Zinsgutschrift', wert: [5, 85] },
    { name: 'Mieteinnahmen', sender: 'Mieter Haus 2', beschreibung: 'Monatliche Mieteinnahme Wohnung', wert: [400, 900] },
    { name: 'Nebenjob Nachhilfe', sender: 'Privat', beschreibung: 'Nachhilfeunterricht Mathematik', wert: [80, 320] },
    { name: 'Rückzahlung Freund', sender: 'Freund Jonas', beschreibung: 'Rückzahlung geliehenes Geld', wert: [20, 150] },
    { name: 'Cashback Aktion', sender: 'Payback', beschreibung: 'Gesammelte Payback-Punkte eingelöst', wert: [5, 35] },
    { name: 'Weihnachtsgeld', sender: 'SAP SE', beschreibung: 'Jährliches Weihnachtsgeld', wert: [1500, 4000] },
    { name: 'Urlaubsgeld', sender: 'SAP SE', beschreibung: 'Jährliches Urlaubsgeld', wert: [800, 2500] },
    { name: 'Provision Vermittlung', sender: 'Immobilien Schmidt', beschreibung: 'Vermittlungsprovision Wohnung', wert: [200, 800] },
    { name: 'Fördergeld BAFÖG', sender: 'BAföG Amt', beschreibung: 'Monatliche Ausbildungsförderung', wert: [300, 860] },
    { name: 'Verkauf Kleinanzeigen', sender: 'eBay Kleinanzeigen', beschreibung: 'Alte Möbel und Kleidung verkauft', wert: [15, 200] },
    { name: 'Prämie Kontoeröffnung', sender: 'Commerzbank', beschreibung: 'Neukundenprämie Girokonto', wert: [50, 150] },
];

const MISCELLANEOUS = [
    { name: 'Haftpflichtversicherung', empfaenger: 'Allianz', beschreibung: 'Jährliche Privathaftpflicht', wert: [-85, -35] },
    { name: 'Rechtsschutzversicherung', empfaenger: 'ARAG', beschreibung: 'Jährliche Rechtsschutzversicherung', wert: [-250, -120] },
    { name: 'Spende Rotes Kreuz', empfaenger: 'DRK', beschreibung: 'Monatliche Spende', wert: [-30, -5] },
    { name: 'Spende UNICEF', empfaenger: 'UNICEF', beschreibung: 'Einmalspende Katastrophenhilfe', wert: [-100, -10] },
    { name: 'Geburtstagsfeier', empfaenger: 'Diverse', beschreibung: 'Essen und Getränke für die Party', wert: [-200, -50] },
    { name: 'Friseur Haarschnitt', empfaenger: 'Friseur Ella', beschreibung: 'Waschen, Schneiden, Föhnen', wert: [-55, -15] },
    { name: 'Post / DHL Paket', empfaenger: 'DHL', beschreibung: 'Paketversand und Porto', wert: [-12, -3] },
    { name: 'Reinigung Textil', empfaenger: 'Textilreinigung Schulz', beschreibung: 'Anzug und Mantel reinigen', wert: [-35, -10] },
    { name: 'Geschirr Reparatur', empfaenger: 'Haushalt & Mehr', beschreibung: 'Reparatur Geschirrspüler', wert: [-150, -50] },
    { name: 'Kontoführungsgebühr', empfaenger: 'Sparkasse', beschreibung: 'Monatliche Kontoführung', wert: [-8, -3] },
    { name: 'Trinkgeld Restaurant', empfaenger: 'Diverse Restaurants', beschreibung: 'Trinkgeld beim Essen gehen', wert: [-10, -2] },
    { name: 'Handy Reparatur', empfaenger: 'Phone Repair Shop', beschreibung: 'Display-Austausch Smartphone', wert: [-180, -60] },
    { name: 'Tierarzt', empfaenger: 'Tierarztpraxis Dr. Fuchs', beschreibung: 'Impfung und Check-up Haustier', wert: [-120, -35] },
    { name: 'Umzugskosten', empfaenger: 'Umzugs GmbH', beschreibung: 'Transportkosten Umzug', wert: [-800, -200] },
    { name: 'Steuerberater', empfaenger: 'Steuerbüro Kraus', beschreibung: 'Jahresabschluss Steuererklärung', wert: [-350, -100] },
    { name: 'Visum Gebühren', empfaenger: 'Konsulat', beschreibung: 'Visum-Bearbeitungsgebühr Reise', wert: [-120, -40] },
    { name: 'Nachhilfe Kind', empfaenger: 'Schülerhilfe', beschreibung: 'Monatliche Nachhilfe Englisch', wert: [-150, -60] },
    { name: 'Sprachkurs VHS', empfaenger: 'VHS München', beschreibung: 'Spanisch-Kurs Anfänger', wert: [-120, -50] },
    { name: 'Bankgebühren Ausland', empfaenger: 'Sparkasse', beschreibung: 'Gebühren für Auslandsüberweisung', wert: [-15, -5] },
    { name: 'Fotoshooting', empfaenger: 'Fotostudio Licht', beschreibung: 'Professionelle Bewerbungsfotos', wert: [-90, -30] },
    { name: 'Passbilder', empfaenger: 'Fotostudio Express', beschreibung: 'Biometrische Passbilder', wert: [-15, -8] },
    { name: 'Schreibwaren', empfaenger: 'Staples', beschreibung: 'Notizbücher, Stifte, Ordner', wert: [-25, -5] },
];

const CATEGORY_MAP = {
    'Food': FOOD,
    'Housing': HOUSING,
    'Transportation': TRANSPORTATION,
    'Leisure': LEISURE,
    'Shopping': SHOPPING,
    'Health': HEALTH,
    'Income': INCOME,
    'Miscellaneous': MISCELLANEOUS,
};

// ─── Distribution weights (how many of 1000 go to each category) ─
const DISTRIBUTION = {
    'Food':           200,  // Most frequent daily category
    'Housing':         80,  // Monthly recurring
    'Transportation': 130,  // Regular
    'Leisure':        120,  // Entertainment
    'Shopping':       130,  // General purchases
    'Health':          70,  // Periodic
    'Income':         150,  // Salary + extras
    'Miscellaneous':  120,  // Everything else
};

// ─── Helper Functions ────────────────────────────────────

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(randomBetween(min, max + 1));
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function roundTo2(n) {
    return Math.round(n * 100) / 100;
}

/**
 * Generate a random ISO timestamp between startDate and endDate.
 * Weighted slightly toward more recent months.
 */
function randomTimestamp(startDate, endDate) {
    const start = startDate.getTime();
    const end = endDate.getTime();
    // Slight bias toward recent dates
    const r = Math.pow(Math.random(), 0.8);
    const ts = start + r * (end - start);
    const d = new Date(ts);
    // Add random hours/minutes for realism
    d.setHours(randomInt(6, 22), randomInt(0, 59), randomInt(0, 59));
    return d.toISOString();
}

/**
 * Generate transactions for a specific category.
 */
function generateForCategory(category, count) {
    const templates = CATEGORY_MAP[category];
    const transactions = [];

    const startDate = new Date('2025-01-01T00:00:00.000Z');
    const endDate = new Date('2026-02-28T23:59:59.000Z');

    for (let i = 0; i < count; i++) {
        const tpl = pick(templates);
        const user = pick(USERS);
        const [minWert, maxWert] = tpl.wert;
        const wert = roundTo2(randomBetween(minWert, maxWert));
        const timestamp = randomTimestamp(startDate, endDate);

        const isIncome = category === 'Income';
        const sender = isIncome ? (tpl.sender || 'Unbekannt') : user.name;
        const empfaenger = isIncome ? user.name : (tpl.empfaenger || 'Unbekannt');

        transactions.push({
            id: null, // will be assigned later
            name: tpl.name,
            kategorie: category,
            wert: wert,
            timestamp: timestamp,
            sender: sender,
            empfaenger: empfaenger,
            user_id: user.id,
            beschreibung: tpl.beschreibung
        });
    }

    return transactions;
}

// ─── Main ────────────────────────────────────────────────

function main() {
    let allTransactions = [];

    for (const [category, count] of Object.entries(DISTRIBUTION)) {
        const txns = generateForCategory(category, count);
        allTransactions = allTransactions.concat(txns);
    }

    // Shuffle for natural ordering
    allTransactions.sort(() => Math.random() - 0.5);

    // Assign guaranteed unique IDs (base timestamp + sequential offset)
    const BASE_ID = 1800000000000;
    allTransactions.forEach((t, idx) => {
        t.id = BASE_ID + idx;
    });

    console.log(`\n🏦 Clarity Demo Data Seeder`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Generated ${allTransactions.length} transactions\n`);

    // Print category breakdown
    const breakdown = {};
    allTransactions.forEach(t => {
        breakdown[t.kategorie] = (breakdown[t.kategorie] || 0) + 1;
    });
    for (const [cat, cnt] of Object.entries(breakdown).sort((a,b) => b[1] - a[1])) {
        console.log(`  ${cat.padEnd(18)} ${cnt} entries`);
    }

    // Print user breakdown
    console.log('');
    const userBreakdown = {};
    allTransactions.forEach(t => {
        const u = USERS.find(u => u.id === t.user_id);
        const label = u ? u.name : `User ${t.user_id}`;
        userBreakdown[label] = (userBreakdown[label] || 0) + 1;
    });
    for (const [user, cnt] of Object.entries(userBreakdown)) {
        console.log(`  ${user.padEnd(18)} ${cnt} entries`);
    }

    // Print date range
    const dates = allTransactions.map(t => new Date(t.timestamp));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    console.log(`\n  Date range: ${minDate.toLocaleDateString('de-DE')} – ${maxDate.toLocaleDateString('de-DE')}\n`);

    // Insert into DB
    console.log('Inserting into database...');

    const stmt = db.prepare(`INSERT INTO transactions (id, name, kategorie, wert, timestamp, sender, empfaenger, user_id, beschreibung) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    let inserted = 0;
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        allTransactions.forEach(t => {
            stmt.run(t.id, t.name, t.kategorie, t.wert, t.timestamp, t.sender, t.empfaenger, t.user_id, t.beschreibung, function(err) {
                if (err) console.error(`  Error inserting ${t.name}:`, err.message);
                inserted++;
            });
        });

        db.run('COMMIT', () => {
            stmt.finalize();
            console.log(`✅ Successfully inserted ${allTransactions.length} transactions!`);

            // Verify
            db.get('SELECT COUNT(*) as cnt FROM transactions', (err, row) => {
                console.log(`📊 Total transactions in database: ${row.cnt}`);
                db.close();
            });
        });
    });
}

main();
