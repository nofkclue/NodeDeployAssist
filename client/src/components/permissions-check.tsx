import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Shield, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { PermissionCheck } from "@shared/schema";

interface PermissionsCheckProps {
  reportId: string | null;
  data: PermissionCheck | null;
}

export default function PermissionsCheck({ reportId, data }: PermissionsCheckProps) {
  const { toast } = useToast();

  const runPermissionCheck = useMutation({
    mutationFn: async () => {
      if (!reportId) throw new Error("No active report");
      const response = await apiRequest("POST", `/api/diagnosis/${reportId}/permission-check`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagnosis', reportId] });
      toast({
        title: "Berechtigung Check abgeschlossen",
        description: "Die Dateiberechtigungen wurden erfolgreich überprüft.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Berechtigungs Check fehlgeschlagen: ${error}`,
        variant: "destructive",
      });
    },
  });

  const getFileIcon = (path: string) => {
    if (path.includes('.json') || path.includes('.js')) return '📄';
    if (!path.includes('.')) return '📁';
    return '📄';
  };

  return (
    <section className="bg-card rounded-lg border border-border p-6" data-testid="permissions-check-section">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Dateiberechtigungen</h2>
            <p className="text-muted-foreground">Verzeichnisstruktur und Zugriffsrechte</p>
          </div>
        </div>
        <Button
          onClick={() => runPermissionCheck.mutate()}
          disabled={!reportId || runPermissionCheck.isPending}
          data-testid="button-check-permissions"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${runPermissionCheck.isPending ? 'animate-spin' : ''}`} />
          Berechtigungen prüfen
        </Button>
      </div>

      {data ? (
        <div className="space-y-4">
          {/* Directory Structure */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">Verzeichnisstruktur</h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
              <pre>📁 /app/
{data.directoryStructure.map((item, index) => (
`├── ${getFileIcon(item.path)} ${item.path} ${item.exists ? `✓ (${item.permissions})` : '✗ nicht gefunden'}`
)).join('\n')}
              </pre>
            </div>
          </div>

          {/* Permission Issues */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">Berechtigungsprobleme</h3>
            <div className="space-y-3">
              {data.issues.map((issue, index) => (
                <div 
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg ${
                    issue.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 
                    issue.type === 'success' ? 'border-green-200 bg-green-50' :
                    'border-red-200 bg-red-50'
                  }`}
                  data-testid={`issue-${index}`}
                >
                  {issue.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{issue.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Keine Berechtigungsdaten verfügbar. Starten Sie eine neue Diagnose.</p>
        </div>
      )}
    </section>
  );
}
