# Deployment-Anleitung für Ihren Server

Diese Anleitung hilft Ihnen, die Anwendung auf Ihrem Server (z.B. mit Phusion Passenger) zu deployen.

## 🚀 Schnellstart

### 1. Dateien hochladen

Laden Sie alle Projektdateien in Ihr Server-Verzeichnis hoch (z.B. `/var/www/your-app/` oder `/httpdocs/`)

### 2. Dependencies installieren

```bash
cd /pfad/zu/ihrer/app
npm install
```

### 3. Diagnose-Tool ausführen (WICHTIG!)

**Bevor Sie bauen**, führen Sie das Diagnose-Tool aus:

```bash
# CLI bauen
bash build-cli.sh

# Diagnose ausführen
./preflight.sh check
```

Das Tool zeigt Ihnen:
- ✅ Welche System-Anforderungen erfüllt sind
- ⚠️ Welche Konfiguration fehlt
- ❌ Welche kritischen Probleme behoben werden müssen
- 💡 Konkrete Lösungsvorschläge mit Befehlen

### 4. Anwendung bauen

```bash
npm run build
```

Dies erstellt:
- `dist/index.js` - Server-Bundle
- `dist/public/` - Frontend-Dateien
- `dist/bin/preflight.js` - CLI-Tool

### 5. Hosting-spezifische Konfiguration

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

## 🔍 Fehlersuche

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
npm install --omit=dev  # Für Produktion
```

## 📋 Checkliste

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

## 🛠️ CLI-Tool Befehle

```bash
# Schnelle Diagnose
./preflight.sh check

# Detaillierter Bericht
./preflight.sh report

# Hosting-Umgebung erkennen
./preflight.sh detect-host

# Server-Logs erfassen (bei Problemen)
./preflight.sh capture

# JSON-Export (für Support)
./preflight.sh check --json > diagnosis.json
```

## 💡 Tipps

1. **Testen Sie lokal zuerst:** Führen Sie `npm run build` und `npm start` lokal aus
2. **Nutzen Sie das Diagnose-Tool:** Es findet 90% aller Deployment-Probleme automatisch
3. **Logs sind wichtig:** `./preflight.sh capture` sammelt alle relevanten Logs
4. **NODE_ENV ist kritisch:** Ohne `NODE_ENV=production` läuft die App nicht optimal

## 📞 Support

Bei Problemen:

1. Führen Sie aus:
   ```bash
   ./preflight.sh report > report.txt
   ./preflight.sh capture > logs.txt
   ```

2. Senden Sie beide Dateien an den Support

Die Ausgaben enthalten alle relevanten Diagnosedaten, sind aber **kopierbar** und **lesbar**.
