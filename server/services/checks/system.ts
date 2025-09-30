import { execSync } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";
import os from "os";
import fs from "fs/promises";
import type { CheckResult } from "@shared/schema";
import { CheckProvider, createCheckResult } from "./base";

const execAsync = promisify(exec);

export class SystemCheckProvider implements CheckProvider {
  category = 'system' as const;

  async runChecks(): Promise<CheckResult[]> {
    const checks: CheckResult[] = [];

    checks.push(await this.checkNodeVersion());
    checks.push(await this.checkNpmVersion());
    checks.push(await this.checkMemory());
    checks.push(await this.checkDiskSpace());
    checks.push(await this.checkEnvironment());

    return checks;
  }

  private async checkNodeVersion(): Promise<CheckResult> {
    try {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0]);

      if (major >= 18) {
        return createCheckResult('system', {
          title: 'Node.js Version',
          status: 'pass',
          severity: 'info',
          message: `Node.js ${version} erkannt`,
          details: { version, major },
        });
      } else {
        return createCheckResult('system', {
          title: 'Node.js Version',
          status: 'warning',
          severity: 'warning',
          message: `Node.js ${version} ist veraltet. Empfohlen: >= 18.x`,
          details: { version, major },
          remediation: 'Aktualisieren Sie Node.js auf Version 18 oder höher',
        });
      }
    } catch (error) {
      return createCheckResult('system', {
        title: 'Node.js Version',
        status: 'fail',
        severity: 'critical',
        message: 'Node.js Version konnte nicht ermittelt werden',
        details: { error: String(error) },
      });
    }
  }

  private async checkNpmVersion(): Promise<CheckResult> {
    try {
      const version = execSync("npm --version", { encoding: "utf8" }).trim();
      const major = parseInt(version.split('.')[0]);

      if (major >= 8) {
        return createCheckResult('system', {
          title: 'NPM Version',
          status: 'pass',
          severity: 'info',
          message: `NPM ${version} verfügbar`,
          details: { version },
        });
      } else {
        return createCheckResult('system', {
          title: 'NPM Version',
          status: 'warning',
          severity: 'warning',
          message: `NPM ${version} ist veraltet`,
          details: { version },
          remediation: 'npm install -g npm@latest',
          command: 'npm install -g npm@latest',
        });
      }
    } catch (error) {
      return createCheckResult('system', {
        title: 'NPM Version',
        status: 'fail',
        severity: 'critical',
        message: 'NPM nicht gefunden',
        details: { error: String(error) },
        remediation: 'Installieren Sie Node.js mit NPM',
      });
    }
  }

  private async checkMemory(): Promise<CheckResult> {
    const totalGB = Math.round(os.totalmem() / (1024 * 1024 * 1024) * 100) / 100;
    const freeGB = Math.round(os.freemem() / (1024 * 1024 * 1024) * 100) / 100;
    const usedPercent = Math.round(((totalGB - freeGB) / totalGB) * 100);

    if (freeGB < 0.5) {
      return createCheckResult('system', {
        title: 'Arbeitsspeicher',
        status: 'warning',
        severity: 'warning',
        message: `Nur ${freeGB}GB freier Speicher verfügbar (${usedPercent}% belegt)`,
        details: { total: totalGB, free: freeGB, usedPercent },
        remediation: 'Beenden Sie ungenutzte Prozesse oder erweitern Sie den RAM',
      });
    }

    return createCheckResult('system', {
      title: 'Arbeitsspeicher',
      status: 'pass',
      severity: 'info',
      message: `${freeGB}GB von ${totalGB}GB frei (${100 - usedPercent}% verfügbar)`,
      details: { total: totalGB, free: freeGB, usedPercent },
    });
  }

  private async checkDiskSpace(): Promise<CheckResult> {
    try {
      const { stdout } = await execAsync("df -BG . | tail -1");
      const parts = stdout.trim().split(/\s+/);
      
      if (parts.length >= 4) {
        const total = parseInt(parts[1].replace('G', ''));
        const used = parseInt(parts[2].replace('G', ''));
        const available = parseInt(parts[3].replace('G', ''));
        const usedPercent = Math.round((used / total) * 100);

        if (available < 1) {
          return createCheckResult('system', {
            title: 'Festplattenspeicher',
            status: 'warning',
            severity: 'warning',
            message: `Nur ${available}GB freier Speicher (${usedPercent}% belegt)`,
            details: { total, used, available, usedPercent },
            remediation: 'Löschen Sie unnötige Dateien oder erweitern Sie den Speicher',
          });
        }

        return createCheckResult('system', {
          title: 'Festplattenspeicher',
          status: 'pass',
          severity: 'info',
          message: `${available}GB von ${total}GB frei`,
          details: { total, used, available, usedPercent },
        });
      }
    } catch (error) {
      // Fallback
    }

    return createCheckResult('system', {
      title: 'Festplattenspeicher',
      status: 'skipped',
      severity: 'info',
      message: 'Speicherplatz konnte nicht ermittelt werden',
    });
  }

  private async checkEnvironment(): Promise<CheckResult> {
    const nodeEnv = process.env.NODE_ENV;
    
    if (!nodeEnv) {
      return createCheckResult('system', {
        title: 'NODE_ENV',
        status: 'warning',
        severity: 'warning',
        message: 'NODE_ENV nicht gesetzt',
        details: { nodeEnv: 'undefined' },
        remediation: 'Setzen Sie NODE_ENV auf "production" oder "development"',
        command: 'export NODE_ENV=production',
      });
    }

    return createCheckResult('system', {
      title: 'NODE_ENV',
      status: 'pass',
      severity: 'info',
      message: `NODE_ENV: ${nodeEnv}`,
      details: { nodeEnv },
    });
  }
}
