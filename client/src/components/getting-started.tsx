import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Server, CheckCircle, FileText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GettingStartedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GettingStarted({ open, onOpenChange }: GettingStartedProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-getting-started">
        <DialogHeader>
          <DialogTitle className="text-2xl" data-testid="title-getting-started">
            Willkommen beim Diagnose-Tool
          </DialogTitle>
          <DialogDescription data-testid="description-getting-started">
            Umfassendes Tool für Node.js Deployment-Diagnose und Fehlerbehebung
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Übersicht</TabsTrigger>
            <TabsTrigger value="cli" data-testid="tab-cli">CLI-Tool</TabsTrigger>
            <TabsTrigger value="web" data-testid="tab-web">Web-Interface</TabsTrigger>
            <TabsTrigger value="deployment" data-testid="tab-deployment">Deployment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Was wird geprüft?
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">System-Checks</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Node.js & NPM Version</li>
                      <li>Verfügbarer Arbeitsspeicher & Festplattenspeicher</li>
                      <li>Umgebungsvariablen</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Build-Checks</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Build-Verzeichnis & Bundles</li>
                      <li>package.json Konfiguration</li>
                      <li>Start- und Build-Skripte</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Platform-Checks</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Hosting-Umgebung (Passenger, PM2, Docker, systemd)</li>
                      <li>Passenger-spezifische Konfiguration</li>
                      <li>Port-Konfiguration & Startup-Dateien</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cli" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  CLI-Tool für Deployment
                </CardTitle>
                <CardDescription>
                  Funktioniert OHNE laufende App - perfekt für Deployment-Probleme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Installation & Build</h4>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Option A: Per SSH</p>
                    <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                      <code>{`# 1. Dependencies installieren
npm install

# 2. CLI bauen
bash build-cli.sh`}</code>
                    </pre>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-md">
                    <p className="text-sm font-medium mb-2">Option B: Über Plesk/Control Panel</p>
                    <p className="text-sm text-muted-foreground mb-2">Wenn Node/NPM nicht per SSH verfügbar:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>In Plesk unter "Node.js" → "NPM Install"</li>
                      <li>Fügen Sie in package.json hinzu: <code className="bg-muted px-1">"build:cli": "node_modules/.bin/esbuild bin/preflight.ts --bundle --platform=node --format=esm --outfile=dist/bin/preflight.js --packages=external"</code></li>
                      <li>In Plesk: Run Script → "build:cli"</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Wichtigste Befehle</h4>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Per SSH:</p>
                    <div className="space-y-2">
                      <div className="bg-muted p-3 rounded-md">
                        <code className="text-sm">./preflight.sh check</code>
                        <p className="text-xs text-muted-foreground mt-1">Schnelle Diagnose</p>
                      </div>
                      <div className="bg-muted p-3 rounded-md">
                        <code className="text-sm">./preflight.sh report</code>
                        <p className="text-xs text-muted-foreground mt-1">Detaillierter Bericht</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-md">
                    <p className="text-sm font-medium mb-2">Über Plesk/Control Panel:</p>
                    <div className="space-y-2">
                      <div className="bg-muted/50 p-2 rounded">
                        <code className="text-xs">node dist/bin/preflight.js check</code>
                        <p className="text-xs text-muted-foreground mt-1">Direkt in Plesk Terminal</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Oder als NPM-Skript: <code className="bg-muted px-1">"preflight": "node dist/bin/preflight.js check"</code> 
                        → dann in Plesk: Run Script → "preflight"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                  <p className="text-sm font-medium mb-2">💡 Wann CLI nutzen?</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Wenn die App auf dem Server nicht startet</li>
                    <li>Vor dem ersten Deployment</li>
                    <li>Bei Passenger-Fehlern</li>
                    <li>Für automatisierte Checks in CI/CD</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="web" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Web-Interface nutzen
                </CardTitle>
                <CardDescription>
                  Interaktive Diagnose mit Echtzeit-Updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Features</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Echtzeit-Diagnose mit WebSocket-Updates</li>
                    <li>Automatische Lösungsvorschläge mit Ein-Klick-Fixes</li>
                    <li>Export-Funktionen für Logs und AI-Reports</li>
                    <li>Schritt-für-Schritt durch alle Checks</li>
                    <li>Kopierbare Ausgaben für Support</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Workflow</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                    <li>Klicken Sie auf "Neue Diagnose"</li>
                    <li>Navigieren Sie durch die Checks (System, Netzwerk, etc.)</li>
                    <li>Sehen Sie Ergebnisse in Echtzeit</li>
                    <li>Bei Problemen: Klicken Sie auf "Lösungsvorschläge"</li>
                    <li>Exportieren Sie Logs für Support oder AI-Analyse</li>
                  </ol>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md">
                  <p className="text-sm font-medium mb-2">⚠️ Wichtig</p>
                  <p className="text-sm text-muted-foreground">
                    Das Web-Interface benötigt eine laufende App. Für Pre-Deployment-Checks 
                    nutzen Sie das CLI-Tool.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deployment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Deployment-Anleitung
                </CardTitle>
                <CardDescription>
                  Schnellstart für Server-Deployment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Schritt-für-Schritt</h4>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li className="text-muted-foreground">
                      <span className="font-medium text-foreground">Dateien hochladen</span> - 
                      Alle Projektdateien auf Ihren Server
                    </li>
                    <li className="text-muted-foreground">
                      <span className="font-medium text-foreground">Dependencies installieren</span> - 
                      <code className="text-xs bg-muted px-1 py-0.5 rounded ml-1">npm install</code>
                    </li>
                    <li className="text-muted-foreground">
                      <span className="font-medium text-foreground">CLI bauen</span> - 
                      <code className="text-xs bg-muted px-1 py-0.5 rounded ml-1">bash build-cli.sh</code>
                    </li>
                    <li className="text-muted-foreground">
                      <span className="font-medium text-foreground">Diagnose ausführen</span> - 
                      <code className="text-xs bg-muted px-1 py-0.5 rounded ml-1">./preflight.sh check</code>
                    </li>
                    <li className="text-muted-foreground">
                      <span className="font-medium text-foreground">Probleme beheben</span> - 
                      Folgen Sie den Lösungsvorschlägen
                    </li>
                    <li className="text-muted-foreground">
                      <span className="font-medium text-foreground">App bauen</span> - 
                      <code className="text-xs bg-muted px-1 py-0.5 rounded ml-1">npm run build</code>
                    </li>
                    <li className="text-muted-foreground">
                      <span className="font-medium text-foreground">Konfigurieren</span> - 
                      Hosting-Panel Einstellungen anpassen
                    </li>
                    <li className="text-muted-foreground">
                      <span className="font-medium text-foreground">Starten</span> - 
                      App über Hosting-Panel starten
                    </li>
                  </ol>
                </div>

                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md">
                  <p className="text-sm font-medium mb-2">💡 Für Phusion Passenger</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Erstellen Sie <code className="bg-muted px-1 py-0.5 rounded">app.js</code>:</p>
                    <pre className="bg-muted p-2 rounded text-xs mt-2">
                      <code>echo "import('./dist/index.js');" {`>`} app.js</code>
                    </pre>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('/DEPLOYMENT.md', '_blank')}
                    data-testid="button-view-deployment-guide"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Vollständige Deployment-Anleitung
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('/bin/README.md', '_blank')}
                    data-testid="button-view-cli-docs"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    CLI-Dokumentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="default" 
            onClick={() => onOpenChange(false)}
            data-testid="button-close-getting-started"
          >
            Verstanden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
