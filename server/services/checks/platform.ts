import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import type { CheckResult, HostingEnvironment } from "@shared/schema";
import { CheckProvider, createCheckResult } from "./base";

const execAsync = promisify(exec);

export class PlatformCheckProvider implements CheckProvider {
  category = 'platform' as const;
  private detectedEnvironment: HostingEnvironment | null = null;

  async runChecks(): Promise<CheckResult[]> {
    const checks: CheckResult[] = [];

    this.detectedEnvironment = await this.detectHostingEnvironment();
    checks.push(this.createEnvironmentCheck());

    if (this.detectedEnvironment.type === 'passenger') {
      checks.push(...await this.runPassengerChecks());
    } else if (this.detectedEnvironment.type === 'pm2') {
      checks.push(...await this.runPM2Checks());
    }

    checks.push(await this.checkStartupFile());
    checks.push(await this.checkPort());

    return checks;
  }

  getDetectedEnvironment(): HostingEnvironment {
    return this.detectedEnvironment || {
      type: 'generic',
      detected: false,
    };
  }

  private async detectHostingEnvironment(): Promise<HostingEnvironment> {
    // Check for Phusion Passenger
    const passengerEnv = await this.detectPassenger();
    if (passengerEnv.detected) return passengerEnv;

    // Check for PM2
    const pm2Env = await this.detectPM2();
    if (pm2Env.detected) return pm2Env;

    // Check for Docker
    const dockerEnv = await this.detectDocker();
    if (dockerEnv.detected) return dockerEnv;

    // Check for systemd
    const systemdEnv = await this.detectSystemd();
    if (systemdEnv.detected) return systemdEnv;

    return { type: 'generic', detected: false };
  }

  private async detectPassenger(): Promise<HostingEnvironment> {
    const indicators = [];

    // Check for passenger-config command
    try {
      const { stdout } = await execAsync('which passenger-config 2>/dev/null');
      if (stdout.trim()) {
        indicators.push('passenger-config gefunden');
        
        try {
          const { stdout: version } = await execAsync('passenger-config --version 2>/dev/null');
          return {
            type: 'passenger',
            detected: true,
            version: version.trim(),
            details: { indicators },
          };
        } catch {}
      }
    } catch {}

    // Check for Passenger environment variables
    if (process.env.PASSENGER_APP_ENV || process.env.PASSENGER_APP_ROOT) {
      indicators.push('Passenger Umgebungsvariablen');
      return {
        type: 'passenger',
        detected: true,
        details: { 
          indicators,
          appRoot: process.env.PASSENGER_APP_ROOT,
          appEnv: process.env.PASSENGER_APP_ENV,
        },
      };
    }

    // Check for .htaccess or passenger config files
    try {
      const htaccessPath = path.join(process.cwd(), '.htaccess');
      const content = await fs.readFile(htaccessPath, 'utf-8');
      if (content.includes('Passenger') || content.includes('passenger')) {
        indicators.push('.htaccess mit Passenger-Konfiguration');
        return {
          type: 'passenger',
          detected: true,
          configPath: htaccessPath,
          details: { indicators },
        };
      }
    } catch {}

    // Check parent directories for Passenger indicators
    try {
      const parentHtaccess = path.join(process.cwd(), '..', '.htaccess');
      const content = await fs.readFile(parentHtaccess, 'utf-8');
      if (content.includes('Passenger') || content.includes('passenger')) {
        indicators.push('Passenger-Konfiguration im übergeordneten Verzeichnis');
        return {
          type: 'passenger',
          detected: true,
          configPath: parentHtaccess,
          details: { indicators },
        };
      }
    } catch {}

    return { type: 'passenger', detected: false };
  }

  private async detectPM2(): Promise<HostingEnvironment> {
    try {
      const { stdout } = await execAsync('which pm2 2>/dev/null');
      if (stdout.trim()) {
        try {
          const { stdout: version } = await execAsync('pm2 --version 2>/dev/null');
          return {
            type: 'pm2',
            detected: true,
            version: version.trim(),
          };
        } catch {}
      }
    } catch {}

    // Check for ecosystem config
    try {
      await fs.access(path.join(process.cwd(), 'ecosystem.config.js'));
      return {
        type: 'pm2',
        detected: true,
        configPath: path.join(process.cwd(), 'ecosystem.config.js'),
      };
    } catch {}

    return { type: 'pm2', detected: false };
  }

  private async detectDocker(): Promise<HostingEnvironment> {
    try {
      await fs.access('/.dockerenv');
      return { type: 'docker', detected: true };
    } catch {}

    if (process.env.DOCKER_CONTAINER) {
      return { type: 'docker', detected: true };
    }

    return { type: 'docker', detected: false };
  }

  private async detectSystemd(): Promise<HostingEnvironment> {
    if (process.env.INVOCATION_ID) {
      return { type: 'systemd', detected: true };
    }

    return { type: 'systemd', detected: false };
  }

  private createEnvironmentCheck(): CheckResult {
    if (!this.detectedEnvironment || !this.detectedEnvironment.detected) {
      return createCheckResult('platform', {
        title: 'Hosting-Umgebung',
        status: 'warning',
        severity: 'info',
        message: 'Keine spezifische Hosting-Umgebung erkannt (generisches Node.js)',
        details: { type: 'generic' },
      });
    }

    const env = this.detectedEnvironment;
    let message = `${env.type.toUpperCase()} erkannt`;
    if (env.version) message += ` (Version: ${env.version})`;

    return createCheckResult('platform', {
      title: 'Hosting-Umgebung',
      status: 'pass',
      severity: 'info',
      message,
      details: env.details || {},
    });
  }

  private async runPassengerChecks(): Promise<CheckResult[]> {
    const checks: CheckResult[] = [];

    // Check for app.js startup file
    try {
      const appJsPath = path.join(process.cwd(), 'app.js');
      await fs.access(appJsPath);
      
      const content = await fs.readFile(appJsPath, 'utf-8');
      
      if (content.includes('import') && content.includes('dist/index.js')) {
        checks.push(createCheckResult('platform', {
          title: 'Passenger Startup-Datei',
          status: 'pass',
          severity: 'info',
          message: 'app.js vorhanden und konfiguriert',
          details: { path: appJsPath },
        }));
      } else {
        checks.push(createCheckResult('platform', {
          title: 'Passenger Startup-Datei',
          status: 'warning',
          severity: 'warning',
          message: 'app.js gefunden, aber möglicherweise falsch konfiguriert',
          details: { path: appJsPath, content },
          remediation: 'app.js sollte enthalten: import(\'./dist/index.js\');',
        }));
      }
    } catch (error) {
      checks.push(createCheckResult('platform', {
        title: 'Passenger Startup-Datei',
        status: 'fail',
        severity: 'critical',
        message: 'app.js nicht gefunden - für Passenger erforderlich!',
        remediation: 'Erstellen Sie app.js mit: import(\'./dist/index.js\');',
        command: 'echo "import(\'./dist/index.js\');" > app.js',
      }));
    }

    // Check Passenger configuration
    const appRoot = process.env.PASSENGER_APP_ROOT || process.cwd();
    const expectedAppRoot = process.cwd();

    if (appRoot !== expectedAppRoot) {
      checks.push(createCheckResult('platform', {
        title: 'Passenger App Root',
        status: 'warning',
        severity: 'warning',
        message: `App Root stimmt nicht überein: ${appRoot} vs ${expectedAppRoot}`,
        details: { configured: appRoot, expected: expectedAppRoot },
        remediation: 'Setzen Sie PassengerAppRoot auf das Projektverzeichnis',
      }));
    } else {
      checks.push(createCheckResult('platform', {
        title: 'Passenger App Root',
        status: 'pass',
        severity: 'info',
        message: 'App Root korrekt konfiguriert',
        details: { appRoot },
      }));
    }

    return checks;
  }

  private async runPM2Checks(): Promise<CheckResult[]> {
    const checks: CheckResult[] = [];

    try {
      await fs.access(path.join(process.cwd(), 'ecosystem.config.js'));
      checks.push(createCheckResult('platform', {
        title: 'PM2 Konfiguration',
        status: 'pass',
        severity: 'info',
        message: 'ecosystem.config.js gefunden',
      }));
    } catch {
      checks.push(createCheckResult('platform', {
        title: 'PM2 Konfiguration',
        status: 'warning',
        severity: 'warning',
        message: 'ecosystem.config.js nicht gefunden',
        remediation: 'Erstellen Sie eine PM2-Konfiguration für bessere Verwaltung',
      }));
    }

    return checks;
  }

  private async checkStartupFile(): Promise<CheckResult> {
    // Check what the main startup file should be
    try {
      const pkgPath = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);
      const startScript = pkg.scripts?.start;

      if (!startScript) {
        return createCheckResult('platform', {
          title: 'Start-Skript',
          status: 'fail',
          severity: 'error',
          message: 'Kein "start" Skript in package.json definiert',
          remediation: 'Fügen Sie ein Start-Skript hinzu',
        });
      }

      if (startScript.includes('dist/index.js')) {
        return createCheckResult('platform', {
          title: 'Start-Skript',
          status: 'pass',
          severity: 'info',
          message: 'Start-Skript verweist auf dist/index.js',
          details: { script: startScript },
        });
      } else {
        return createCheckResult('platform', {
          title: 'Start-Skript',
          status: 'warning',
          severity: 'warning',
          message: `Start-Skript verweist nicht auf dist/index.js: ${startScript}`,
          details: { script: startScript },
          remediation: 'Start-Skript sollte "node dist/index.js" ausführen',
        });
      }
    } catch (error) {
      return createCheckResult('platform', {
        title: 'Start-Skript',
        status: 'fail',
        severity: 'error',
        message: 'package.json konnte nicht gelesen werden',
        details: { error: String(error) },
      });
    }
  }

  private async checkPort(): Promise<CheckResult> {
    const port = process.env.PORT || '5000';
    
    return createCheckResult('platform', {
      title: 'Port-Konfiguration',
      status: 'pass',
      severity: 'info',
      message: `Konfigurierter Port: ${port}`,
      details: { port, source: process.env.PORT ? 'Umgebungsvariable' : 'Standard (5000)' },
    });
  }
}
