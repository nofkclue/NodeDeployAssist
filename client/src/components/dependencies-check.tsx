import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Package, RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { DependencyAnalysis } from "@shared/schema";

interface DependenciesCheckProps {
  reportId: string | null;
  data: DependencyAnalysis | null | undefined;
}

export default function DependenciesCheck({ reportId, data }: DependenciesCheckProps) {
  const { toast } = useToast();

  const runDependencyCheck = useMutation({
    mutationFn: async () => {
      if (!reportId) throw new Error("No active report");
      const response = await apiRequest("POST", `/api/diagnosis/${reportId}/dependency-check`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagnosis', reportId] });
      toast({
        title: "Abhängigkeits-Analyse abgeschlossen",
        description: "Die Dependencies wurden erfolgreich analysiert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Abhängigkeits-Analyse fehlgeschlagen: ${error}`,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getStatusText = (status: boolean, successText: string, failText: string) => {
    return status ? (
      <span className="text-xs text-green-600">✓ {successText}</span>
    ) : (
      <span className="text-xs text-red-600">✗ {failText}</span>
    );
  };

  return (
    <section className="bg-card rounded-lg border border-border p-6" data-testid="dependencies-check-section">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Dependencies Analyse</h2>
            <p className="text-muted-foreground">Package.json und Abhängigkeitskonflikte</p>
          </div>
        </div>
        <Button
          onClick={() => runDependencyCheck.mutate()}
          disabled={!reportId || runDependencyCheck.isPending}
          data-testid="button-analyze-dependencies"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${runDependencyCheck.isPending ? 'animate-spin' : ''}`} />
          Abhängigkeiten analysieren
        </Button>
      </div>

      {data ? (
        <div className="space-y-4">
          {/* Package.json Validation */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">Package.json Validation</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between" data-testid="validation-syntax">
                  <span className="text-sm">Syntax</span>
                  {getStatusText(data.packageJsonValid, "Gültig", "Ungültig")}
                </div>
                <div className="flex items-center justify-between" data-testid="validation-start-script">
                  <span className="text-sm">Start Script</span>
                  {getStatusText(data.hasStartScript, "Gefunden", "Nicht gefunden")}
                </div>
                <div className="flex items-center justify-between" data-testid="validation-dependencies">
                  <span className="text-sm">Dependencies</span>
                  {data.outdatedPackages.length > 0 ? (
                    <span className="text-xs text-yellow-600">⚠ {data.outdatedPackages.length} veraltete</span>
                  ) : (
                    <span className="text-xs text-green-600">✓ Aktuell</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between" data-testid="validation-engine">
                  <span className="text-sm">Engine Compatibility</span>
                  {getStatusText(data.engineCompatible, "Kompatibel", "Inkompatibel")}
                </div>
                <div className="flex items-center justify-between" data-testid="validation-security">
                  <span className="text-sm">Security Audit</span>
                  {data.vulnerabilities.length > 0 ? (
                    <span className="text-xs text-red-600">✗ {data.vulnerabilities.length} Vulnerabilities</span>
                  ) : (
                    <span className="text-xs text-green-600">✓ Sicher</span>
                  )}
                </div>
                <div className="flex items-center justify-between" data-testid="validation-lock-file">
                  <span className="text-sm">Lock File</span>
                  {getStatusText(data.lockFileExists, "Vorhanden", "Fehlt")}
                </div>
              </div>
            </div>
          </div>

          {/* Dependency Issues */}
          {(data.vulnerabilities.length > 0 || data.outdatedPackages.length > 0) && (
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-medium mb-3">Gefundene Probleme</h3>
              <div className="space-y-3">
                {data.vulnerabilities.map((vuln, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border-red-200 bg-red-50 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Security Vulnerability: {vuln.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{vuln.description}</p>
                    </div>
                  </div>
                ))}
                {data.outdatedPackages.map((pkg, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border-yellow-200 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Veraltete Dependency: {pkg.name}@{pkg.current}</p>
                      <p className="text-xs text-muted-foreground mt-1">Aktuelle Version: {pkg.latest} verfügbar</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <h3 className="font-medium mb-3">Empfohlene Aktionen</h3>
            <div className="space-y-2">
              {data.vulnerabilities.length > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">npm audit fix</code>
                  <span>- Security Vulnerabilities beheben</span>
                </div>
              )}
              {data.outdatedPackages.length > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">npm update</code>
                  <span>- Veraltete Packages aktualisieren</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <code className="bg-muted px-2 py-1 rounded text-xs">npm ci</code>
                <span>- Clean Installation durchführen</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Keine Abhängigkeitsdaten verfügbar. Starten Sie eine neue Diagnose.</p>
        </div>
      )}
    </section>
  );
}
