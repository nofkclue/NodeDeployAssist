import { 
  type DiagnosticReport, 
  type FixSuggestion, 
  type FixExecutionResult,
  type DependencyAnalysis,
  type NetworkTest,
  type SystemInfo,
  type PermissionCheck
} from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class FixSuggestionsService {
  
  generateFixSuggestions(report: DiagnosticReport): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    
    // Security vulnerability fixes
    const depAnalysis = report.dependencyAnalysis as DependencyAnalysis | null;
    if (depAnalysis?.vulnerabilities?.length) {
      for (const vuln of depAnalysis.vulnerabilities) {
        suggestions.push({
          id: `fix-vuln-${vuln.name}`,
          category: 'security',
          title: `Sicherheitslücke in ${vuln.name} beheben`,
          description: `${vuln.description}. Aktualisierung auf eine sichere Version wird empfohlen.`,
          severity: vuln.severity as any,
          command: `npm update ${vuln.name.split('@')[0]}`,
          isExecutable: true,
          estimatedTime: '30 Sekunden',
          impact: 'Behebt kritische Sicherheitslücke'
        });
      }
    }

    // Outdated package fixes
    if (depAnalysis?.outdatedPackages?.length) {
      for (const pkg of depAnalysis.outdatedPackages) {
        suggestions.push({
          id: `update-pkg-${pkg.name}`,
          category: 'compatibility',
          title: `${pkg.name} aktualisieren`,
          description: `Veraltete Version ${pkg.current} auf ${pkg.latest} aktualisieren.`,
          severity: 'medium',
          command: `npm install ${pkg.name}@${pkg.latest}`,
          isExecutable: true,
          estimatedTime: '1 Minute',
          impact: 'Verbessert Kompatibilität und Stabilität'
        });
      }
    }

    // Port conflict fixes - information only, no auto-execution for safety
    const networkTests = report.networkTests as NetworkTest | null;
    if (networkTests?.portTests) {
      const busyPorts = networkTests.portTests.filter(test => !test.available);
      for (const port of busyPorts) {
        suggestions.push({
          id: `fix-port-${port.port}`,
          category: 'configuration',
          title: `Port ${port.port} Konflikt lösen`,
          description: `Port ${port.port} ist bereits belegt${port.pid ? ` von Prozess ${port.pid}. Beenden Sie den Prozess manuell mit: kill ${port.pid}` : ''}.`,
          severity: 'high',
          command: undefined,  // SECURITY: Never auto-execute kill commands
          isExecutable: false,
          estimatedTime: '10 Sekunden',
          impact: 'Gibt Port für Ihre Anwendung frei'
        });
      }
    }

    // Performance optimizations
    const systemInfo = report.systemInfo as SystemInfo | null;
    if (systemInfo) {
      const freeMemoryPercent = (systemInfo.freeMemory / systemInfo.totalMemory) * 100;
      if (freeMemoryPercent < 20) {
        suggestions.push({
          id: 'optimize-memory',
          category: 'performance',
          title: 'Speicher optimieren',
          description: `Nur ${freeMemoryPercent.toFixed(1)}% RAM verfügbar. Speicher-intensive Prozesse sollten beendet werden.`,
          severity: 'medium',
          command: 'pm2 restart all --max-memory-restart 1G',
          isExecutable: false,
          estimatedTime: '2 Minuten',
          impact: 'Gibt Arbeitsspeicher frei und verbessert Performance'
        });
      }

      const diskUsagePercent = (systemInfo.diskUsed / systemInfo.diskTotal) * 100;
      if (diskUsagePercent > 80) {
        suggestions.push({
          id: 'cleanup-disk',
          category: 'performance',
          title: 'NPM Cache bereinigen',
          description: `Festplatte ist zu ${diskUsagePercent.toFixed(1)}% belegt. NPM Cache bereinigung wird empfohlen.`,
          severity: 'medium',
          command: 'npm cache clean --force',
          isExecutable: true,
          estimatedTime: '30 Sekunden',
          impact: 'Gibt NPM Cache Speicher frei'
        });
      }
    }

    // File permission fixes - information only, no auto-execution for safety
    const permissionChecks = report.permissionChecks as PermissionCheck | null;
    if (permissionChecks?.issues) {
      const criticalIssues = permissionChecks.issues.filter(issue => issue.type !== 'success');
      for (const issue of criticalIssues) {
        if (issue.solution && issue.solution.includes('chmod')) {
          suggestions.push({
            id: `fix-permission-${Math.random().toString(36).substring(7)}`,
            category: 'configuration',
            title: 'Dateiberechtigungen korrigieren',
            description: `${issue.message}. Führen Sie manuell aus: ${issue.solution}`,
            severity: 'high',
            command: undefined,  // SECURITY: Never auto-execute chmod commands
            isExecutable: false,
            estimatedTime: '5 Sekunden',
            impact: 'Stellt korrekte Dateiberechtigungen sicher'
          });
        }
      }
    }

    // Missing start script fix
    if (depAnalysis && !depAnalysis.hasStartScript) {
      suggestions.push({
        id: 'add-start-script',
        category: 'configuration',
        title: 'Start-Script hinzufügen',
        description: 'package.json enthält kein "start" Script. Dies ist für das Hosting erforderlich.',
        severity: 'high',
        command: undefined,
        isExecutable: false,
        estimatedTime: '2 Minuten',
        impact: 'Ermöglicht automatisches Starten der Anwendung'
      });
    }

    return suggestions.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  async executeFixSuggestion(suggestion: FixSuggestion): Promise<FixExecutionResult> {
    if (!suggestion.isExecutable || !suggestion.command) {
      return {
        success: false,
        output: '',
        error: 'Diese Lösung kann nicht automatisch ausgeführt werden',
        duration: 0
      };
    }

    // Security: STRICT whitelist of allowed commands
    // Only allow safe NPM commands with validated package names
    const allowedCommands = [
      /^npm update [a-zA-Z0-9@_-]+$/,
      /^npm install [a-zA-Z0-9@._-]+@[0-9]+\.[0-9]+\.[0-9]+$/,
      /^npm cache clean --force$/,
      /^npm audit fix$/
    ];

    const isCommandAllowed = allowedCommands.some(pattern => pattern.test(suggestion.command!));
    
    if (!isCommandAllowed) {
      return {
        success: false,
        output: '',
        error: 'Dieser Befehl ist aus Sicherheitsgründen nicht erlaubt. Nur sichere NPM-Befehle sind erlaubt.',
        duration: 0
      };
    }

    const startTime = Date.now();
    
    try {
      const { stdout, stderr } = await execAsync(suggestion.command, { timeout: 30000 });
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        output: stdout || 'Befehl erfolgreich ausgeführt',
        error: stderr || undefined,
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        output: error.stdout || '',
        error: error.message || 'Unbekannter Fehler bei der Ausführung',
        duration
      };
    }
  }
}

export const fixSuggestionsService = new FixSuggestionsService();