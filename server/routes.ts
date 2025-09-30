import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { diagnosticsService } from "./services/diagnostics";
import { fixSuggestionsService } from "./services/fix-suggestions";
import WebSocket, { WebSocketServer } from "ws";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates - use specific path to avoid conflict with Vite
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws/diagnostics'
  });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast progress updates to all connected clients
  const broadcastProgress = (reportId: string, progress: number, message: string) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'progress',
          reportId,
          progress,
          message,
        }));
      }
    });
  };

  // Start new diagnosis
  app.post("/api/diagnosis", async (req, res) => {
    try {
      const report = await storage.createDiagnosticReport({
        status: "running",
        progress: 0,
        systemInfo: null,
        networkTests: null,
        permissionChecks: null,
        dependencyAnalysis: null,
        logs: "",
        aiReport: null,
      });

      // Run diagnosis in background - each check is independent and continues on error
      setImmediate(async () => {
        const logs: string[] = [];
        let systemInfo: any = null;
        let networkTests: any = null;
        let permissionChecks: any = null;
        let dependencyAnalysis: any = null;

        try {
          // System check
          broadcastProgress(report.id, 10, "Systemumgebung wird überprüft...");
          try {
            systemInfo = await diagnosticsService.getSystemInfo();
            await storage.updateDiagnosticReport(report.id, {
              systemInfo: systemInfo as any,
              progress: 25,
            });
            logs.push(`[SUCCESS] Systemumgebung erfolgreich geprüft`);
          } catch (error) {
            logs.push(`[ERROR] Systemcheck fehlgeschlagen: ${error}`);
          }

          // Network check
          broadcastProgress(report.id, 25, "Netzwerkverbindung wird getestet...");
          try {
            networkTests = await diagnosticsService.testNetworkConnectivity();
            await storage.updateDiagnosticReport(report.id, {
              networkTests: networkTests as any,
              progress: 50,
            });
            logs.push(`[SUCCESS] Netzwerkverbindung erfolgreich getestet`);
          } catch (error) {
            logs.push(`[ERROR] Netzwerktest fehlgeschlagen: ${error}`);
          }

          // Permission check
          broadcastProgress(report.id, 50, "Dateiberechtigungen werden geprüft...");
          try {
            permissionChecks = await diagnosticsService.checkPermissions();
            await storage.updateDiagnosticReport(report.id, {
              permissionChecks: permissionChecks as any,
              progress: 75,
            });
            logs.push(`[SUCCESS] Dateiberechtigungen erfolgreich geprüft`);
          } catch (error) {
            logs.push(`[ERROR] Berechtigungscheck fehlgeschlagen: ${error}`);
          }

          // Dependency check
          broadcastProgress(report.id, 75, "Abhängigkeiten werden analysiert...");
          try {
            dependencyAnalysis = await diagnosticsService.analyzeDependencies();
            await storage.updateDiagnosticReport(report.id, {
              dependencyAnalysis: dependencyAnalysis as any,
              progress: 90,
            });
            logs.push(`[SUCCESS] Abhängigkeiten erfolgreich analysiert`);
          } catch (error) {
            logs.push(`[ERROR] Abhängigkeitsanalyse fehlgeschlagen: ${error}`);
          }

          // Generate AI report with whatever data we have
          broadcastProgress(report.id, 95, "Bericht wird erstellt...");
          let aiReport = "Diagnose teilweise abgeschlossen.";
          try {
            const fullResult = {
              systemInfo: systemInfo || {},
              networkTests: networkTests || {},
              permissionChecks: permissionChecks || {},
              dependencyAnalysis: dependencyAnalysis || {},
              logs
            };
            aiReport = diagnosticsService.generateAIReport(fullResult);
          } catch (error) {
            logs.push(`[ERROR] Bericht-Erstellung fehlgeschlagen: ${error}`);
          }

          // Update final report
          await storage.updateDiagnosticReport(report.id, {
            logs: logs.join("\n"),
            aiReport,
            status: "completed",
            progress: 100,
          });
          
          broadcastProgress(report.id, 100, "Diagnose abgeschlossen");
        } catch (error) {
          await storage.updateDiagnosticReport(report.id, {
            status: "failed",
            logs: logs.concat([`[FATAL ERROR] ${error}`]).join("\n"),
          });
          broadcastProgress(report.id, 100, `Kritischer Fehler: ${error}`);
        }
      });

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: `Failed to start diagnosis: ${error}` });
    }
  });

  // Get diagnosis report
  app.get("/api/diagnosis/:id", async (req, res) => {
    try {
      const report = await storage.getDiagnosticReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: `Failed to get report: ${error}` });
    }
  });

  // Get all diagnosis reports
  app.get("/api/diagnosis", async (req, res) => {
    try {
      const reports = await storage.getAllDiagnosticReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: `Failed to get reports: ${error}` });
    }
  });

  // Run individual system check
  app.post("/api/diagnosis/:id/system-check", async (req, res) => {
    try {
      const systemInfo = await diagnosticsService.getSystemInfo();
      
      await storage.updateDiagnosticReport(req.params.id, {
        systemInfo: systemInfo as any,
      });

      res.json(systemInfo);
    } catch (error) {
      res.status(500).json({ message: `System check failed: ${error}` });
    }
  });

  // Run network tests
  app.post("/api/diagnosis/:id/network-check", async (req, res) => {
    try {
      const networkTests = await diagnosticsService.testNetworkConnectivity();
      
      await storage.updateDiagnosticReport(req.params.id, {
        networkTests: networkTests as any,
      });

      res.json(networkTests);
    } catch (error) {
      res.status(500).json({ message: `Network check failed: ${error}` });
    }
  });

  // Run permission checks
  app.post("/api/diagnosis/:id/permission-check", async (req, res) => {
    try {
      const permissionChecks = await diagnosticsService.checkPermissions();
      
      await storage.updateDiagnosticReport(req.params.id, {
        permissionChecks: permissionChecks as any,
      });

      res.json(permissionChecks);
    } catch (error) {
      res.status(500).json({ message: `Permission check failed: ${error}` });
    }
  });

  // Run dependency analysis
  app.post("/api/diagnosis/:id/dependency-check", async (req, res) => {
    try {
      const dependencyAnalysis = await diagnosticsService.analyzeDependencies();
      
      await storage.updateDiagnosticReport(req.params.id, {
        dependencyAnalysis: dependencyAnalysis as any,
      });

      res.json(dependencyAnalysis);
    } catch (error) {
      res.status(500).json({ message: `Dependency check failed: ${error}` });
    }
  });

  // Export logs
  app.get("/api/diagnosis/:id/export-logs", async (req, res) => {
    try {
      const report = await storage.getDiagnosticReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="diagnosis-${report.id}.log"`);
      res.send(report.logs || "No logs available");
    } catch (error) {
      res.status(500).json({ message: `Export failed: ${error}` });
    }
  });

  // Export AI report
  app.get("/api/diagnosis/:id/export-ai-report", async (req, res) => {
    try {
      const report = await storage.getDiagnosticReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="ai-report-${report.id}.txt"`);
      res.send(report.aiReport || "No AI report available");
    } catch (error) {
      res.status(500).json({ message: `Export failed: ${error}` });
    }
  });

  // Get fix suggestions for a diagnostic report
  app.get("/api/diagnosis/:id/fix-suggestions", async (req, res) => {
    try {
      const report = await storage.getDiagnosticReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const suggestions = fixSuggestionsService.generateFixSuggestions(report);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: `Failed to generate fix suggestions: ${error}` });
    }
  });

  // Execute a fix suggestion
  app.post("/api/diagnosis/:id/execute-fix", async (req, res) => {
    try {
      // Validate request body
      const executeFixSchema = z.object({
        suggestionId: z.string().min(1, "Suggestion ID is required")
      });
      
      const { suggestionId } = executeFixSchema.parse(req.body);
      
      const report = await storage.getDiagnosticReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Only allow execution on completed reports
      if (report.status !== "completed") {
        return res.status(400).json({ message: "Can only execute fixes on completed diagnoses" });
      }

      const suggestions = fixSuggestionsService.generateFixSuggestions(report);
      const suggestion = suggestions.find(s => s.id === suggestionId);
      
      if (!suggestion) {
        return res.status(404).json({ message: "Fix suggestion not found" });
      }

      if (!suggestion.isExecutable) {
        return res.status(400).json({ message: "This fix suggestion cannot be executed automatically" });
      }

      const result = await fixSuggestionsService.executeFixSuggestion(suggestion);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      res.status(500).json({ message: `Failed to execute fix: ${error}` });
    }
  });

  return httpServer;
}
