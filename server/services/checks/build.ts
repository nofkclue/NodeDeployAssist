import fs from "fs/promises";
import path from "path";
import type { CheckResult } from "@shared/schema";
import { CheckProvider, createCheckResult } from "./base";

export class BuildCheckProvider implements CheckProvider {
  category = 'build' as const;

  async runChecks(): Promise<CheckResult[]> {
    const checks: CheckResult[] = [];

    checks.push(await this.checkDistExists());
    checks.push(await this.checkServerBundle());
    checks.push(await this.checkClientBundle());
    checks.push(await this.checkPackageJson());
    checks.push(await this.checkBuildScripts());

    return checks;
  }

  private async checkDistExists(): Promise<CheckResult> {
    try {
      const distPath = path.join(process.cwd(), 'dist');
      await fs.access(distPath);

      return createCheckResult('build', {
        title: 'Build-Verzeichnis',
        status: 'pass',
        severity: 'info',
        message: 'dist/ Verzeichnis gefunden',
        details: { path: distPath },
      });
    } catch (error) {
      return createCheckResult('build', {
        title: 'Build-Verzeichnis',
        status: 'fail',
        severity: 'critical',
        message: 'dist/ Verzeichnis nicht gefunden - Projekt muss gebaut werden',
        remediation: 'Führen Sie "npm run build" aus',
        command: 'npm run build',
      });
    }
  }

  private async checkServerBundle(): Promise<CheckResult> {
    try {
      const serverPath = path.join(process.cwd(), 'dist', 'index.js');
      const stats = await fs.stat(serverPath);

      if (stats.size === 0) {
        return createCheckResult('build', {
          title: 'Server-Bundle',
          status: 'fail',
          severity: 'critical',
          message: 'dist/index.js ist leer',
          remediation: 'Führen Sie "npm run build" erneut aus',
          command: 'npm run build',
        });
      }

      return createCheckResult('build', {
        title: 'Server-Bundle',
        status: 'pass',
        severity: 'info',
        message: `dist/index.js vorhanden (${Math.round(stats.size / 1024)}KB)`,
        details: { path: serverPath, size: stats.size },
      });
    } catch (error) {
      return createCheckResult('build', {
        title: 'Server-Bundle',
        status: 'fail',
        severity: 'critical',
        message: 'dist/index.js nicht gefunden',
        details: { error: String(error) },
        remediation: 'Führen Sie "npm run build" aus',
        command: 'npm run build',
      });
    }
  }

  private async checkClientBundle(): Promise<CheckResult> {
    try {
      const publicPath = path.join(process.cwd(), 'dist', 'public');
      await fs.access(publicPath);

      const files = await fs.readdir(publicPath);
      const hasIndexHtml = files.includes('index.html');
      const hasAssets = files.some(f => f.startsWith('assets') || f.includes('.js') || f.includes('.css'));

      if (!hasIndexHtml) {
        return createCheckResult('build', {
          title: 'Client-Bundle',
          status: 'fail',
          severity: 'critical',
          message: 'dist/public/index.html fehlt',
          remediation: 'Führen Sie "npm run build" aus',
          command: 'npm run build',
        });
      }

      if (!hasAssets) {
        return createCheckResult('build', {
          title: 'Client-Bundle',
          status: 'warning',
          severity: 'warning',
          message: 'Keine Assets in dist/public/ gefunden',
          remediation: 'Überprüfen Sie den Build-Prozess',
        });
      }

      return createCheckResult('build', {
        title: 'Client-Bundle',
        status: 'pass',
        severity: 'info',
        message: `Client-Dateien vorhanden (${files.length} Dateien)`,
        details: { path: publicPath, fileCount: files.length },
      });
    } catch (error) {
      return createCheckResult('build', {
        title: 'Client-Bundle',
        status: 'fail',
        severity: 'critical',
        message: 'dist/public/ nicht gefunden',
        remediation: 'Führen Sie "npm run build" aus',
        command: 'npm run build',
      });
    }
  }

  private async checkPackageJson(): Promise<CheckResult> {
    try {
      const pkgPath = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);

      const issues: string[] = [];

      if (!pkg.scripts?.build) {
        issues.push('Kein "build" Script');
      }

      if (!pkg.scripts?.start) {
        issues.push('Kein "start" Script');
      }

      if (pkg.type !== 'module') {
        issues.push('package.json hat type != "module" (ES Modules erforderlich)');
      }

      if (issues.length > 0) {
        return createCheckResult('build', {
          title: 'package.json',
          status: 'warning',
          severity: 'warning',
          message: `Konfigurationsprobleme: ${issues.join(', ')}`,
          details: { issues },
        });
      }

      return createCheckResult('build', {
        title: 'package.json',
        status: 'pass',
        severity: 'info',
        message: 'package.json korrekt konfiguriert',
        details: { 
          hasType: pkg.type === 'module',
          hasStartScript: !!pkg.scripts?.start,
          hasBuildScript: !!pkg.scripts?.build,
        },
      });
    } catch (error) {
      return createCheckResult('build', {
        title: 'package.json',
        status: 'fail',
        severity: 'critical',
        message: 'package.json nicht lesbar',
        details: { error: String(error) },
      });
    }
  }

  private async checkBuildScripts(): Promise<CheckResult> {
    try {
      const pkgPath = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);

      const buildScript = pkg.scripts?.build;
      const startScript = pkg.scripts?.start;

      if (!buildScript) {
        return createCheckResult('build', {
          title: 'Build-Skripte',
          status: 'fail',
          severity: 'error',
          message: 'Kein Build-Skript definiert',
          remediation: 'Fügen Sie ein Build-Skript in package.json hinzu',
        });
      }

      const expectedStart = 'node dist/index.js';
      const hasCorrectStart = startScript && startScript.includes('dist/index.js');

      if (!hasCorrectStart) {
        return createCheckResult('build', {
          title: 'Build-Skripte',
          status: 'warning',
          severity: 'warning',
          message: `Start-Skript sollte "${expectedStart}" enthalten`,
          details: { current: startScript, expected: expectedStart },
          remediation: `Ändern Sie "start" zu: "NODE_ENV=production ${expectedStart}"`,
        });
      }

      return createCheckResult('build', {
        title: 'Build-Skripte',
        status: 'pass',
        severity: 'info',
        message: 'Build- und Start-Skripte korrekt konfiguriert',
        details: { build: buildScript, start: startScript },
      });
    } catch (error) {
      return createCheckResult('build', {
        title: 'Build-Skripte',
        status: 'fail',
        severity: 'error',
        message: 'Skripte konnten nicht überprüft werden',
        details: { error: String(error) },
      });
    }
  }
}
