import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { DiagnosticReport } from "@shared/schema";
import { Server, Download, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SidebarNav from "@/components/sidebar-nav";
import SystemCheck from "@/components/system-check";
import NetworkCheck from "@/components/network-check";
import PermissionsCheck from "@/components/permissions-check";
import DependenciesCheck from "@/components/dependencies-check";
import LogsReport from "@/components/logs-report";
import QuickActions from "@/components/quick-actions";

export default function Home() {
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState("system");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const { toast } = useToast();

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress' && data.reportId === currentReportId) {
        setProgress(data.progress);
        setProgressMessage(data.message);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/diagnosis', data.reportId] });
      }
    };

    return () => {
      ws.close();
    };
  }, [currentReportId]);

  // Get current diagnosis report
  const { data: currentReport } = useQuery({
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
      toast({
        title: "Diagnose gestartet",
        description: "Die Systemdiagnose läuft. Fortschritt wird in Echtzeit angezeigt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Diagnose konnte nicht gestartet werden: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Export diagnostic report
  const exportReport = () => {
    if (!currentReportId) return;
    
    window.open(`/api/diagnosis/${currentReportId}/export-logs`, '_blank');
    toast({
      title: "Export gestartet",
      description: "Der Diagnosebericht wird heruntergeladen.",
    });
  };

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
  };

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
                data={currentReport?.systemInfo} 
              />
            )}
            
            {currentStep === "network" && (
              <NetworkCheck 
                reportId={currentReportId} 
                data={currentReport?.networkTests} 
              />
            )}
            
            {currentStep === "permissions" && (
              <PermissionsCheck 
                reportId={currentReportId} 
                data={currentReport?.permissionChecks} 
              />
            )}
            
            {currentStep === "dependencies" && (
              <DependenciesCheck 
                reportId={currentReportId} 
                data={currentReport?.dependencyAnalysis} 
              />
            )}
            
            {currentStep === "logs" && (
              <LogsReport 
                reportId={currentReportId} 
                logs={currentReport?.logs} 
                aiReport={currentReport?.aiReport} 
              />
            )}

            {/* Quick Actions Panel */}
            <QuickActions reportId={currentReportId} />
          </div>
        </div>
      </div>
    </div>
  );
}
