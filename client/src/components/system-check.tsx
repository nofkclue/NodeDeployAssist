import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Monitor, RefreshCw, CheckCircle, AlertTriangle, XCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { SystemInfo } from "@shared/schema";

interface SystemCheckProps {
  reportId: string | null;
  data: SystemInfo | null | undefined;
}

export default function SystemCheck({ reportId, data }: SystemCheckProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const runSystemCheck = useMutation({
    mutationFn: async () => {
      if (!reportId) throw new Error("No active report");
      const response = await apiRequest("POST", `/api/diagnosis/${reportId}/system-check`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagnosis', reportId] });
      toast({
        title: "System Check abgeschlossen",
        description: "Die Systemumgebung wurde erfolgreich überprüft.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `System Check fehlgeschlagen: ${error}`,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  const systemChecks = data ? [
    {
      title: "Node.js Version",
      value: data.nodeVersion,
      status: "success" as const,
      message: "Empfohlene Version gefunden"
    },
    {
      title: "NPM Version",
      value: data.npmVersion,
      status: (
        data.npmVersion.includes('Fehler') || data.npmVersion.includes('nicht gefunden') || data.npmVersion.includes('command not found')
          ? "error"
          : data.npmVersion.startsWith('8.')
          ? "warning"
          : "success"
      ) as 'error' | 'warning' | 'success',
      message: 
        data.npmVersion.includes('Fehler') || data.npmVersion.includes('nicht gefunden') || data.npmVersion.includes('command not found')
          ? data.npmVersion
          : data.npmVersion.startsWith('8.')
          ? "Version 9.x empfohlen"
          : "Aktuelle Version"
    },
    {
      title: "Verfügbarer Speicher",
      value: `${data.freeMemory} GB verfügbar`,
      status: (data.freeMemory < 1 ? "error" : "success") as 'error' | 'success',
      message: data.freeMemory < 1 ? "Wenig Speicher verfügbar" : "Ausreichend Speicher"
    },
    {
      title: "Festplattenspeicher",
      value: data.diskTotal === 0 ? "Fehler beim Auslesen" : `${data.diskAvailable} GB verfügbar`,
      status: (
        data.diskTotal === 0 ? "error" :
        data.diskAvailable < 2 ? "error" : 
        "success"
      ) as 'error' | 'success',
      message: 
        data.diskTotal === 0 ? "Speicherinformationen nicht verfügbar" :
        data.diskAvailable < 2 ? "Weniger als 2GB verfügbar" : 
        "Ausreichend Speicher"
    }
  ] : [];

  return (
    <section className="bg-card rounded-lg border border-border p-6" data-testid="system-check-section">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Monitor className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">System Umgebung</h2>
            <p className="text-muted-foreground">Überprüfung der Grundvoraussetzungen</p>
          </div>
        </div>
        <Button
          onClick={() => runSystemCheck.mutate()}
          disabled={!reportId || runSystemCheck.isPending}
          data-testid="button-recheck-system"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${runSystemCheck.isPending ? 'animate-spin' : ''}`} />
          Erneut prüfen
        </Button>
      </div>

      {data ? (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {systemChecks.map((check, index) => (
              <div 
                key={index}
                className={`p-4 border rounded-lg transition-transform hover:scale-[1.02] ${getStatusColor(check.status)}`}
                data-testid={`check-${check.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{check.title}</span>
                  {getStatusIcon(check.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{check.value}</p>
                <div className={`text-xs px-2 py-1 rounded ${
                  check.status === 'success' ? 'text-green-700 bg-green-100' :
                  check.status === 'warning' ? 'text-yellow-700 bg-yellow-100' :
                  'text-red-700 bg-red-100'
                }`}>
                  {check.status === 'success' ? '✓' : check.status === 'warning' ? '⚠' : '✗'} {check.message}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed System Info */}
          <div className="mt-6">
            <button 
              className="w-full text-left p-4 border border-border rounded-lg hover:bg-accent transition-colors"
              onClick={() => setShowDetails(!showDetails)}
              data-testid="button-toggle-details"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Detaillierte Systeminformationen</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {showDetails && (
              <div className="mt-4 p-4 border border-border rounded-lg bg-muted/50" data-testid="system-details">
                <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{`Operating System: ${data.os}
Architecture: ${data.architecture}
CPU: ${data.cpuCores} cores
Total Memory: ${data.totalMemory} GB
Free Memory: ${data.freeMemory} GB
Node.js Version: ${data.nodeVersion}
NPM Version: ${data.npmVersion}
Disk Space: 
  Total: ${data.diskTotal} GB
  Used: ${data.diskUsed} GB
  Available: ${data.diskAvailable} GB
Environment Variables:
${Object.entries(data.envVars).map(([key, value]) => `  ${key}: ${value}`).join('\n')}`}</pre>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Keine Systemdaten verfügbar. Starten Sie eine neue Diagnose.</p>
        </div>
      )}
    </section>
  );
}
