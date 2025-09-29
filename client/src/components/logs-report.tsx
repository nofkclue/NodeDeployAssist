import { FileText, Download, Copy, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LogsReportProps {
  reportId: string | null;
  logs: string | null;
  aiReport: string | null;
}

export default function LogsReport({ reportId, logs, aiReport }: LogsReportProps) {
  const { toast } = useToast();

  const exportLogs = () => {
    if (!reportId) return;
    window.open(`/api/diagnosis/${reportId}/export-logs`, '_blank');
    toast({
      title: "Logs exportiert",
      description: "Die Logs werden als Datei heruntergeladen.",
    });
  };

  const exportAIReport = () => {
    if (!reportId) return;
    window.open(`/api/diagnosis/${reportId}/export-ai-report`, '_blank');
    toast({
      title: "KI-Bericht exportiert",
      description: "Der KI-Bericht wird als Datei heruntergeladen.",
    });
  };

  const copyAIReport = () => {
    if (!aiReport) return;
    navigator.clipboard.writeText(aiReport);
    toast({
      title: "Kopiert",
      description: "KI-Bericht wurde in die Zwischenablage kopiert.",
    });
  };

  return (
    <section className="bg-card rounded-lg border border-border p-6" data-testid="logs-report-section">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Logs & KI-Bericht</h2>
            <p className="text-muted-foreground">Detaillierte Logs und KI-optimierte Berichte</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={exportLogs}
            disabled={!reportId || !logs}
            data-testid="button-export-logs"
          >
            <Download className="w-4 h-4 mr-2" />
            Logs exportieren
          </Button>
          <Button
            onClick={exportAIReport}
            disabled={!reportId || !aiReport}
            data-testid="button-generate-ai-report"
          >
            <Brain className="w-4 h-4 mr-2" />
            KI-Bericht exportieren
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Detailed Logs */}
        {logs ? (
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">Vollständiges Diagnose-Log</h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto max-h-80 overflow-y-auto">
              <pre data-testid="diagnostic-logs">{logs}</pre>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">Vollständiges Diagnose-Log</h3>
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Keine Logs verfügbar. Starten Sie eine neue Diagnose.</p>
            </div>
          </div>
        )}

        {/* AI-Ready Report */}
        {aiReport ? (
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">KI-optimierter Diagnose-Bericht</h3>
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Zusammenfassung für KI-Analyse:</h4>
              <div className="text-sm space-y-2" data-testid="ai-report-content">
                <pre className="whitespace-pre-wrap font-sans">{aiReport}</pre>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button 
                size="sm"
                onClick={copyAIReport}
                data-testid="button-copy-ai-report"
              >
                <Copy className="w-3 h-3 mr-1" />
                Kopieren
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={exportAIReport}
                data-testid="button-download-ai-report"
              >
                <Download className="w-3 h-3 mr-1" />
                Als .txt speichern
              </Button>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">KI-optimierter Diagnose-Bericht</h3>
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">KI-Bericht wird nach Abschluss der Diagnose erstellt.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
