import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { DiagnosticReport } from "@shared/schema";
import { Server, Download, Play, RefreshCw, BookOpen, AlertCircle, Copy, Check, Terminal, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import SidebarNav from "@/components/sidebar-nav";
import SystemCheck from "@/components/system-check";
import NetworkCheck from "@/components/network-check";
import PermissionsCheck from "@/components/permissions-check";
import DependenciesCheck from "@/components/dependencies-check";
import LogsReport from "@/components/logs-report";
import QuickActions from "@/components/quick-actions";
import { FixSuggestions } from "@/components/fix-suggestions";
import { GettingStarted } from "@/components/getting-started";

export default function Home() {
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState("system");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string }>({ 
    open: false, 
    title: "", 
    message: "" 
  });
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'error' | 'warning' }>>([]);
  const [showLogs, setShowLogs] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/diagnostics`);
    
    const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
      const timestamp = new Date().toLocaleTimeString('de-DE');
      setLogs(prev => [...prev.slice(-99), { timestamp, message, type }]);
    };

    ws.onopen = () => {
      addLog('WebSocket-Verbindung hergestellt', 'success');
    };

    ws.onclose = () => {
      addLog('WebSocket-Verbindung geschlossen', 'warning');
    };

    ws.onerror = () => {
      addLog('WebSocket-Fehler aufgetreten', 'error');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress' && data.reportId === currentReportId) {
        setProgress(data.progress);
        setProgressMessage(data.message);
        addLog(`${data.message} (${Math.round(data.progress)}%)`, 'info');
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/diagnosis', data.reportId] });
      }
    };

    return () => {
      ws.close();
    };
  }, [currentReportId]);

  // Get current diagnosis report
  const { data: currentReport } = useQuery<DiagnosticReport>({
    queryKey: ['/api/diagnosis', currentReportId],
    enabled: !!currentReportId,
  });

  // Start new diagnosis mutation
  const startDiagnosis = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/diagnosis");
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentReportId(data.id);
      setProgress(0);
      setProgressMessage("Diagnose gestartet...");
      setLogs(prev => [...prev, { 
        timestamp: new Date().toLocaleTimeString('de-DE'), 
        message: `Neue Diagnose gestartet (ID: ${data.id.substring(0, 8)}...)`, 
        type: 'success' 
      }]);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorDialog({
        open: true,
        title: "Fehler beim Starten der Diagnose",
        message: `Die Diagnose konnte nicht gestartet werden.\n\nFehlermeldung:\n${errorMessage}\n\nBitte überprüfen Sie die Verbindung und versuchen Sie es erneut.`
      });
    },
  });

  // Export diagnostic report
  const exportReport = () => {
    if (!currentReportId) return;
    window.open(`/api/diagnosis/${currentReportId}/export-logs`, '_blank');
  };

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
  };

  const copyErrorToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(errorDialog.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const closeErrorDialog = () => {
    setErrorDialog({ open: false, title: "", message: "" });
    setCopied(false);
  };

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (showLogs && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  return (
    <div className="min-h-screen bg-background" data-testid="main-container">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Server className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Node.js Hosting Diagnose</h1>
                <p className="text-sm text-muted-foreground">Automatische Problemerkennung und Lösungsvorschläge</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGettingStarted(true)}
                data-testid="button-getting-started"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Anleitung
              </Button>
              <Button
                variant="secondary"
                onClick={exportReport}
                disabled={!currentReportId}
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Bericht
              </Button>
              <Button 
                onClick={() => startDiagnosis.mutate()}
                disabled={startDiagnosis.isPending}
                data-testid="button-new-diagnosis"
              >
                {startDiagnosis.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Neue Diagnose
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Live Log Terminal */}
      {logs.length > 0 && (
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-6">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="w-full flex items-center justify-between py-3 hover:bg-accent/50 transition-colors"
              data-testid="button-toggle-logs"
            >
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Live-Log</span>
                <span className="text-xs text-muted-foreground">({logs.length} Einträge)</span>
              </div>
              {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showLogs && (
              <div className="pb-4">
                <div className="bg-black/95 rounded-lg p-4 font-mono text-xs max-h-48 overflow-y-auto" data-testid="log-terminal">
                  {logs.map((log, idx) => (
                    <div key={idx} className="mb-1">
                      <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                      <span className={
                        log.type === 'success' ? 'text-green-400' :
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'warning' ? 'text-yellow-400' :
                        'text-blue-400'
                      }>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <SidebarNav 
              currentStep={currentStep} 
              onStepChange={handleStepChange}
              progress={progress}
              progressMessage={progressMessage}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {currentStep === "system" && (
              <SystemCheck 
                reportId={currentReportId} 
                data={currentReport?.systemInfo || null} 
              />
            )}
            
            {currentStep === "network" && (
              <NetworkCheck 
                reportId={currentReportId} 
                data={currentReport?.networkTests || null} 
              />
            )}
            
            {currentStep === "permissions" && (
              <PermissionsCheck 
                reportId={currentReportId} 
                data={currentReport?.permissionChecks || null} 
              />
            )}
            
            {currentStep === "dependencies" && (
              <DependenciesCheck 
                reportId={currentReportId} 
                data={currentReport?.dependencyAnalysis || null} 
              />
            )}
            
            {currentStep === "fixes" && (
              <FixSuggestions 
                reportId={currentReportId || undefined}
              />
            )}
            
            {currentStep === "logs" && (
              <LogsReport 
                reportId={currentReportId} 
                logs={currentReport?.logs ?? null} 
                aiReport={currentReport?.aiReport ?? null} 
              />
            )}

            {/* Quick Actions Panel */}
            <QuickActions reportId={currentReportId} />
          </div>
        </div>
      </div>

      {/* Getting Started Dialog */}
      <GettingStarted 
        open={showGettingStarted} 
        onOpenChange={setShowGettingStarted} 
      />

      {/* Error Dialog */}
      <AlertDialog open={errorDialog.open} onOpenChange={closeErrorDialog}>
        <AlertDialogContent className="max-w-2xl" data-testid="dialog-error">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive" data-testid="title-error">
              <AlertCircle className="w-5 h-5" />
              {errorDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap font-mono border border-border max-h-96 overflow-y-auto" data-testid="text-error-message">
                    {errorDialog.message}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={copyErrorToClipboard}
                    data-testid="button-copy-error"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Kopiert
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Kopieren
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sie können die Fehlermeldung kopieren und an den Support senden oder zur Fehlersuche verwenden.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={closeErrorDialog} data-testid="button-close-error">
              Schließen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
