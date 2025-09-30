# Pre-Flight Diagnose-Tool

Dieses CLI-Tool hilft bei der Diagnose von Deployment-Problemen **bevor** die Anwendung läuft.

## Installation & Build

### Option A: Per SSH (Standard)

```bash
# 1. Dependencies installieren
npm install

# 2. CLI bauen (erstellt dist/bin/preflight.js)
bash build-cli.sh
```

### Option B: Über NPM Terminal (Plesk/Control Panel)

Wenn Sie nur ein NPM Terminal haben (wo `npm` bereits voreingestellt ist):

**1. NPM-Skripte zur package.json hinzufügen:**
```json
"scripts": {
  "build:cli": "node_modules/.bin/esbuild bin/preflight.ts --bundle --platform=node --format=esm --outfile=dist/bin/preflight.js --packages=external",
  "preflight": "node dist/bin/preflight.js check",
  "preflight:report": "node dist/bin/preflight.js report",
  "preflight:detect": "node dist/bin/preflight.js detect-host",
  "preflight:capture": "node dist/bin/preflight.js capture"
}
```

**2. Im NPM Terminal ausführen:**
```bash
# Dependencies installieren
install

# CLI bauen
run build:cli

# Diagnose durchführen
run preflight
```

## Verwendung

### Auf Ihrem Server (Produktion):

**Option A: Per SSH**
```bash
# Schnelle Diagnose
./preflight.sh check

# Detaillierter Bericht
./preflight.sh report

# Hosting-Umgebung erkennen
./preflight.sh detect-host

# Server-Logs erfassen
./preflight.sh capture

# JSON-Ausgabe (zum Kopieren/Weiterverarbeiten)
./preflight.sh check --json
```

**Option B: Über NPM Terminal (Plesk/Control Panel)**

Im NPM Terminal (wo `npm` voreingestellt ist):
```bash
# Schnelle Diagnose
run preflight

# Detaillierter Bericht  
run preflight:report

# Hosting-Umgebung erkennen
run preflight:detect

# Server-Logs erfassen
run preflight:capture
```

**Voraussetzung:** NPM-Skripte müssen in `package.json` definiert sein (siehe Installation oben)

### In der Entwicklung (mit TypeScript):

```bash
# Direkt mit tsx ausführen (nur Development)
npx tsx bin/preflight.ts check
npx tsx bin/preflight.ts report
npx tsx bin/preflight.ts detect-host
```

## Was wird geprüft?

### System-Checks
- ✓ Node.js Version (>= 18 empfohlen)
- ✓ NPM Version
- ✓ Verfügbarer Arbeitsspeicher
- ✓ Freier Festplattenspeicher
- ✓ NODE_ENV Umgebungsvariable

### Build-Checks
- ✓ `dist/` Verzeichnis vorhanden
- ✓ `dist/index.js` (Server-Bundle) vorhanden
- ✓ `dist/public/` (Client-Bundle) vorhanden
- ✓ `package.json` Konfiguration
- ✓ Build- und Start-Skripte korrekt

### Platform-Checks
- ✓ Hosting-Umgebung erkennen (Passenger, PM2, Docker, systemd)
- ✓ Passenger-spezifische Checks:
  - `app.js` Startup-Datei vorhanden und korrekt
  - PassengerAppRoot konfiguriert
- ✓ Start-Skript Konfiguration
- ✓ Port-Konfiguration

## Beispiel-Ausgabe

```
════════════════════════════════════════════════════════════════════════════════
  🚀 DEPLOYMENT-DIAGNOSE
════════════════════════════════════════════════════════════════════════════════

Zeitstempel: 30.9.2025, 15:30:45
Node.js: v21.7.3 | NPM: 10.2.4
Hosting: PASSENGER ✓
Build-Status: ✗ Nicht gebaut

────────────────────────────────────────────────────────────────────────────────

📊 Zusammenfassung:
  ✓ 8 erfolgreich
  ⚠ 1 Warnungen
  ⚠ 3 KRITISCH

❌ Kritische Probleme gefunden:

  ✗ Build-Verzeichnis
    dist/ Verzeichnis nicht gefunden - Projekt muss gebaut werden
    → Lösung: Führen Sie "npm run build" aus
    $ npm run build
```

## Häufige Probleme und Lösungen

### 1. "dist/ Verzeichnis nicht gefunden"
**Problem:** Projekt wurde nicht gebaut
**Lösung:**
```bash
npm run build
```

### 2. "app.js nicht gefunden" (Passenger)
**Problem:** Passenger Startup-Datei fehlt
**Lösung:**
```bash
echo "import('./dist/index.js');" > app.js
```

### 3. "NODE_ENV nicht gesetzt"
**Problem:** Umgebungsvariable fehlt
**Lösung:** In Ihrem Hosting-Panel unter "Umgebungsvariablen":
- Variable: `NODE_ENV`
- Wert: `production`

### 4. "Start-Skript verweist nicht auf dist/index.js"
**Problem:** Falsche Startdatei konfiguriert
**Lösung:** In Ihrem Hosting-Panel:
- Anwendungsstartdatei: `dist/index.js` oder `app.js` (für Passenger)

## Fehlerbehebung

### Das Tool läuft nicht

```bash
# 1. Stellen Sie sicher, dass es gebaut wurde
bash build-cli.sh

# 2. Verwenden Sie das Wrapper-Script
./preflight.sh check

# 3. Oder rufen Sie es direkt auf
node dist/bin/preflight.js check
```

### Auf dem Server (ohne Entwickler-Tools)

Das gebundelte CLI funktioniert **ohne** TypeScript oder tsx:

```bash
# Nach npm install --omit=dev
node dist/bin/preflight.js check
```

### Build-Fehler

```bash
# Falls esbuild nicht installiert ist
npm install

# CLI neu bauen
bash build-cli.sh
```

## Support

Bei Problemen:
1. Führen Sie `npx tsx bin/preflight.ts report` aus
2. Führen Sie `npx tsx bin/preflight.ts capture` aus (für Logs)
3. Kopieren Sie die Ausgabe für die Fehleranalyse
