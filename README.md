# Node.js Hosting Diagnose-Tool

Ein umfassendes Diagnose-Tool für Node.js-Anwendungen, das systematisch Server-Umgebungen testet, Deployment-Probleme identifiziert und detaillierte Troubleshooting-Berichte liefert.

## ✨ Hauptfeatures

- 🔍 **Pre-Deployment Diagnose** - Funktioniert OHNE laufende App
- 🚀 **Eigenständiges CLI-Tool** - Erkennt Deployment-Probleme vor dem Start
- 🌐 **Web-Interface** - Interaktive Diagnose mit Echtzeit-Updates
- 🔧 **Automatische Lösungsvorschläge** - Ein-Klick-Fixes für häufige Probleme
- 📊 **Hosting-Erkennung** - Unterstützt Passenger, PM2, Docker, systemd
- 📋 **Kopierbare Reports** - Strukturierte Ausgaben für Support & Debugging
- 🇩🇪 **Deutsche Oberfläche** - Vollständig auf Deutsch

## 🎯 Was wird geprüft?

### System-Checks
- Node.js & NPM Version
- Verfügbarer Arbeitsspeicher
- Festplattenspeicher
- Umgebungsvariablen

### Build-Checks
- Build-Verzeichnis & Bundles
- package.json Konfiguration
- Start- und Build-Skripte

### Platform-Checks
- Hosting-Umgebung (Passenger, PM2, Docker, systemd)
- Passenger-spezifische Konfiguration
- Port-Konfiguration
- Startup-Dateien

## 📋 Systemanforderungen

- Node.js >= 18
- NPM >= 8
- 1GB freier Arbeitsspeicher
- 500MB freier Festplattenspeicher

## 🚀 Installation & Schnellstart

### 1. Projekt klonen oder herunterladen

```bash
git clone <repository-url>
cd <projekt-verzeichnis>
```

### 2. Dependencies installieren

**Option A: Per SSH**
```bash
npm install
```

**Option B: Über NPM Terminal (Plesk/Control Panel)**

Wenn Sie nur ein NPM Terminal haben (wo `npm` bereits voreingestellt ist):
```
install
```

### 3. CLI-Tool bauen

**Option A: Per SSH**
```bash
bash build-cli.sh
```

**Option B: Über NPM Terminal**

Fügen Sie folgende Skripte zu `package.json` hinzu:
```json
"scripts": {
  "build:cli": "node_modules/.bin/esbuild bin/preflight.ts --bundle --platform=node --format=esm --outfile=dist/bin/preflight.js --packages=external",
  "preflight": "node dist/bin/preflight.js check",
  "preflight:report": "node dist/bin/preflight.js report",
  "preflight:detect": "node dist/bin/preflight.js detect-host",
  "preflight:capture": "node dist/bin/preflight.js capture"
}
```

Dann im NPM Terminal:
```
run build:cli
```

## 🛠️ CLI-Tool Nutzung

### Per SSH

```bash
# Schnelle Diagnose
./preflight.sh check

# Detaillierter Bericht
./preflight.sh report

# Hosting-Umgebung erkennen
./preflight.sh detect-host

# Server-Logs erfassen
./preflight.sh capture

# JSON-Ausgabe
./preflight.sh check --json
```

### Über NPM Terminal (Plesk/Control Panel)

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

### CLI Beispiel-Ausgabe

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

## 🌐 Web-Interface

### Lokal starten

```bash
npm run dev
```

Öffnen Sie http://localhost:5000

### Web-Interface Features

- **Echtzeit-Diagnose** mit WebSocket-Updates
- **Automatische Fixes** mit Sicherheits-Validierung
- **Export-Funktionen** für Logs und AI-Reports
- **Schritt-für-Schritt-Interface** durch alle Checks
- **Kopierbare Ausgaben** für einfaches Debugging

## 📦 Deployment auf Ihrem Server

### Schritt 1: Dateien hochladen

Laden Sie alle Projektdateien in Ihr Server-Verzeichnis hoch (z.B. `/var/www/your-app/` oder `/httpdocs/`)

### Schritt 2: Dependencies installieren

```bash
npm install
```

### Schritt 3: Diagnose ausführen (WICHTIG!)

**Bevor Sie bauen**, führen Sie das Diagnose-Tool aus:

```bash
bash build-cli.sh
./preflight.sh check
```

Das Tool zeigt Ihnen:
- ✅ Welche System-Anforderungen erfüllt sind
- ⚠️ Welche Konfiguration fehlt
- ❌ Welche kritischen Probleme behoben werden müssen
- 💡 Konkrete Lösungsvorschläge mit Befehlen

### Schritt 4: Anwendung bauen

```bash
npm run build
```

Dies erstellt:
- `dist/index.js` - Server-Bundle
- `dist/public/` - Frontend-Dateien
- `dist/bin/preflight.js` - CLI-Tool

### Schritt 5: Hosting-spezifische Konfiguration

#### Für Phusion Passenger:

1. **Erstellen Sie `app.js`** im Hauptverzeichnis:
```bash
echo "import('./dist/index.js');" > app.js
```

2. **Hosting-Panel Einstellungen:**
   - Anwendungsstamm: `/pfad/zu/ihrer/app` (z.B. `/httpdocs` oder `/var/www/app`)
   - Anwendungsstartdatei: `app.js`
   - Node.js Version: >= 18
   - Anwendungsmodus: `production`

3. **Umgebungsvariablen setzen:**
   - `NODE_ENV` = `production`
   - `PORT` = (von Ihrem Hosting vorgegeben, meist automatisch)

#### Für PM2:

```bash
pm2 start dist/index.js --name "diagnostics-tool"
pm2 save
pm2 startup
```

#### Für systemd oder Docker:

```bash
NODE_ENV=production node dist/index.js
```

### Deployment-Checkliste

Vor dem Deployment:
- [ ] Alle Dateien hochgeladen
- [ ] `npm install` ausgeführt
- [ ] `bash build-cli.sh` ausgeführt
- [ ] `./preflight.sh check` zeigt keine kritischen Fehler
- [ ] `npm run build` erfolgreich
- [ ] `app.js` erstellt (für Passenger)
- [ ] Hosting-Panel korrekt konfiguriert
- [ ] `NODE_ENV=production` gesetzt

Nach dem Deployment:
- [ ] Anwendung startet ohne Fehler
- [ ] URL ist erreichbar
- [ ] Keine Fehler im Browser
- [ ] WebSocket-Verbindung funktioniert

## 🔍 Fehlersuche & Troubleshooting

### Wenn die App nicht startet:

1. **Führen Sie das Diagnose-Tool aus:**
```bash
./preflight.sh report
```

2. **Erfassen Sie Server-Logs:**
```bash
./preflight.sh capture
```

3. **Erkennen Sie Ihre Hosting-Umgebung:**
```bash
./preflight.sh detect-host
```

### Häufige Fehler bei Passenger:

#### Error: "Web application could not be started"

**Lösung 1:** app.js fehlt oder ist falsch konfiguriert
```bash
echo "import('./dist/index.js');" > app.js
```

**Lösung 2:** dist/index.js fehlt
```bash
npm run build
```

**Lösung 3:** Falsches Anwendungsstamm-Verzeichnis
- Prüfen Sie in Ihrem Hosting-Panel
- Muss auf das Verzeichnis mit package.json zeigen

#### Error: "Cannot find module"

**Lösung:** Dependencies nicht installiert
```bash
npm install --omit=dev
```

### Häufige CLI-Probleme:

#### 1. "dist/ Verzeichnis nicht gefunden"
**Problem:** Projekt wurde nicht gebaut  
**Lösung:**
```bash
npm run build
```

#### 2. "app.js nicht gefunden" (Passenger)
**Problem:** Passenger Startup-Datei fehlt  
**Lösung:**
```bash
echo "import('./dist/index.js');" > app.js
```

#### 3. "NODE_ENV nicht gesetzt"
**Problem:** Umgebungsvariable fehlt  
**Lösung:** In Ihrem Hosting-Panel unter "Umgebungsvariablen":
- Variable: `NODE_ENV`
- Wert: `production`

#### 4. CLI läuft nicht
```bash
# Stellen Sie sicher, dass es gebaut wurde
bash build-cli.sh

# Verwenden Sie das Wrapper-Script
./preflight.sh check

# Oder rufen Sie es direkt auf
node dist/bin/preflight.js check
```

## 💡 Häufige Anwendungsfälle

### 1. App startet nicht auf dem Server
```bash
./preflight.sh report
```
Zeigt ALLE Probleme mit konkreten Lösungen.

### 2. Passenger-Fehler "Web application could not be started"
```bash
./preflight.sh detect-host
./preflight.sh check
```
Prüft Passenger-Konfiguration und zeigt fehlende Dateien.

### 3. Vor dem Deployment testen
```bash
npm run build
./preflight.sh check
```
Stellt sicher, dass alles bereit für Produktion ist.

## 🏗️ Technologie-Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Real-time:** WebSocket für Live-Updates
- **Storage:** In-Memory (keine Datenbank erforderlich)

## 🤝 Entwicklung

```bash
# Development-Server starten
npm run dev

# TypeScript prüfen
npm run check

# Projekt bauen
npm run build

# CLI bauen
bash build-cli.sh

# CLI direkt ausführen (Development)
npx tsx bin/preflight.ts check
npx tsx bin/preflight.ts report
```

## 🔒 Sicherheit

- Befehlsausführung ist auf eine **strenge Whitelist** beschränkt
- Nur sichere NPM-Befehle sind erlaubt
- Keine gefährlichen Befehle wie `kill` oder `chmod` werden auto-ausgeführt
- Keine Secrets werden geloggt oder exportiert
- Alle User-Inputs werden validiert

## 📞 Support

Bei Problemen:

1. CLI-Report erstellen:
   ```bash
   ./preflight.sh report > report.txt
   ./preflight.sh capture > logs.txt
   ```

2. Beide Dateien für Support-Anfrage bereithalten

Die Ausgaben sind kopierbar und enthalten keine sensiblen Daten.

## 💡 Tipps

1. **Testen Sie lokal zuerst:** Führen Sie `npm run build` und `npm start` lokal aus
2. **Nutzen Sie das Diagnose-Tool:** Es findet 90% aller Deployment-Probleme automatisch
3. **Logs sind wichtig:** `./preflight.sh capture` sammelt alle relevanten Logs
4. **NODE_ENV ist kritisch:** Ohne `NODE_ENV=production` läuft die App nicht optimal
5. **WebSocket bei Plesk:** Proxy-Modus in Plesk muss deaktiviert sein

## 📄 Weitere Dokumentation

- **[replit.md](replit.md)** - Technische Architektur & Entwickler-Hinweise

## 📄 Lizenz

MIT
