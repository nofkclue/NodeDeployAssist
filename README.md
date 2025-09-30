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

## 🚀 Schnellstart

### 1. Installation

```bash
git clone <repository-url>
cd <projekt-verzeichnis>
npm install
```

### 2. CLI-Tool nutzen (für Deployment)

```bash
# CLI bauen
bash build-cli.sh

# Schnelle Diagnose
./preflight.sh check

# Detaillierter Bericht
./preflight.sh report

# Hosting-Umgebung erkennen
./preflight.sh detect-host

# Server-Logs erfassen
./preflight.sh capture
```

### 3. Web-Interface nutzen (lokal)

```bash
npm run dev
```

Öffnen Sie http://localhost:5000

## 📚 Dokumentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Vollständige Deployment-Anleitung für Server
- **[bin/README.md](bin/README.md)** - CLI-Tool Dokumentation
- **[replit.md](replit.md)** - Technische Architektur & Entwickler-Hinweise

## 🔧 Deployment

### Für Produktion bauen

```bash
npm run build
bash build-cli.sh
```

Dies erstellt:
- `dist/index.js` - Server
- `dist/public/` - Frontend
- `dist/bin/preflight.js` - CLI-Tool

### Starten

```bash
npm start
```

**Wichtig:** Lesen Sie [DEPLOYMENT.md](DEPLOYMENT.md) für detaillierte Deployment-Anweisungen, besonders für Phusion Passenger.

## 🛠️ CLI-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `./preflight.sh check` | Schnelle Diagnose |
| `./preflight.sh report` | Detaillierter Bericht |
| `./preflight.sh detect-host` | Hosting-Umgebung erkennen |
| `./preflight.sh capture` | Server-Logs erfassen |
| `./preflight.sh check --json` | JSON-Ausgabe |

## 🌐 Web-Interface Features

- **Echtzeit-Diagnose** mit WebSocket-Updates
- **Automatische Fixes** mit Sicherheits-Validierung
- **Export-Funktionen** für Logs und AI-Reports
- **Schritt-für-Schritt-Interface** durch alle Checks
- **Kopierbare Ausgaben** für einfaches Debugging

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

## 📋 Systemanforderungen

- Node.js >= 18
- NPM >= 8
- 1GB freier Arbeitsspeicher
- 500MB freier Festplattenspeicher

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
```

## 📄 Lizenz

MIT

## 🔒 Sicherheit

- Befehlsausführung ist auf eine Whitelist beschränkt
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
