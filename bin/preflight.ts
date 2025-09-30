#!/usr/bin/env node

import { SystemCheckProvider } from "../server/services/checks/system";
import { BuildCheckProvider } from "../server/services/checks/build";
import { PlatformCheckProvider } from "../server/services/checks/platform";
import type { CheckResult, PreflightSummary } from "../shared/schema";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

class PreflightCLI {
  async run(args: string[]) {
    const command = args[0] || 'check';

    try {
      switch (command) {
        case 'check':
          await this.runCheck(args.includes('--json'));
          break;
        case 'report':
          await this.runReport(args.includes('--json'));
          break;
        case 'detect-host':
          await this.detectHost(args.includes('--json'));
          break;
        case 'capture':
          await this.captureLogs();
          break;
        case 'help':
        case '--help':
        case '-h':
          this.showHelp();
          break;
        default:
          console.error(`${COLORS.red}Unbekannter Befehl: ${command}${COLORS.reset}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error(`${COLORS.red}Fehler: ${error}${COLORS.reset}`);
      process.exit(1);
    }
  }

  private async runCheck(json: boolean = false) {
    const checks = await this.performAllChecks();
    const summary = this.createSummary(checks);

    if (json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      this.printTextSummary(summary);
    }

    process.exit(summary.criticalIssues > 0 ? 1 : 0);
  }

  private async runReport(json: boolean = false) {
    const checks = await this.performAllChecks();
    const summary = this.createSummary(checks);

    if (json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      this.printDetailedReport(summary);
    }

    process.exit(summary.criticalIssues > 0 ? 1 : 0);
  }

  private async detectHost(json: boolean = false) {
    const platformProvider = new PlatformCheckProvider();
    await platformProvider.runChecks();
    const env = platformProvider.getDetectedEnvironment();

    if (json) {
      console.log(JSON.stringify(env, null, 2));
    } else {
      this.printHeader('🔍 HOSTING-UMGEBUNG');
      console.log(`\nTyp: ${COLORS.cyan}${env.type.toUpperCase()}${COLORS.reset}`);
      console.log(`Erkannt: ${env.detected ? COLORS.green + 'JA' : COLORS.red + 'NEIN'}${COLORS.reset}`);
      if (env.version) console.log(`Version: ${env.version}`);
      if (env.configPath) console.log(`Konfiguration: ${env.configPath}`);
      if (env.details) {
        console.log('\nDetails:');
        console.log(JSON.stringify(env.details, null, 2));
      }
    }
  }

  private async captureLogs() {
    this.printHeader('📋 LOG-ERFASSUNG');

    // Try to capture Passenger logs
    console.log('\n🔍 Suche nach Passenger-Logs...\n');
    
    const logLocations = [
      '/var/log/passenger.log',
      '~/.passenger/logs',
      '/var/log/nginx/error.log',
      '/var/log/apache2/error.log',
    ];

    for (const location of logLocations) {
      try {
        const { stdout } = await execAsync(`tail -100 ${location} 2>/dev/null || echo ""`);
        if (stdout.trim()) {
          console.log(`${COLORS.green}✓${COLORS.reset} Logs gefunden: ${location}`);
          console.log(`\n${COLORS.gray}${'='.repeat(80)}${COLORS.reset}`);
          console.log(stdout);
          console.log(`${COLORS.gray}${'='.repeat(80)}${COLORS.reset}\n`);
        }
      } catch {}
    }

    // Capture npm logs
    try {
      const { stdout } = await execAsync('npm config get logs-max 2>/dev/null && cat ~/.npm/_logs/*.log 2>/dev/null | tail -50 || echo ""');
      if (stdout.trim()) {
        console.log(`\n${COLORS.green}✓${COLORS.reset} NPM-Logs:`);
        console.log(`\n${COLORS.gray}${'='.repeat(80)}${COLORS.reset}`);
        console.log(stdout);
        console.log(`${COLORS.gray}${'='.repeat(80)}${COLORS.reset}\n`);
      }
    } catch {}

    console.log('\n💡 Tipp: Kopieren Sie die obigen Logs für die Fehleranalyse');
  }

  private async performAllChecks(): Promise<CheckResult[]> {
    const allChecks: CheckResult[] = [];

    const systemProvider = new SystemCheckProvider();
    const buildProvider = new BuildCheckProvider();
    const platformProvider = new PlatformCheckProvider();

    allChecks.push(...await systemProvider.runChecks());
    allChecks.push(...await buildProvider.runChecks());
    allChecks.push(...await platformProvider.runChecks());

    return allChecks;
  }

  private createSummary(checks: CheckResult[]): PreflightSummary {
    const platformProvider = new PlatformCheckProvider();
    
    const nodeVersion = process.version;
    let npmVersion = 'unknown';
    try {
      const { execSync } = require('child_process');
      npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    } catch {}

    const buildCheck = checks.find(c => c.title === 'Build-Verzeichnis');
    const buildStatus = buildCheck?.status === 'pass' ? 'built' : 
                       buildCheck?.status === 'warning' ? 'partial' : 
                       buildCheck?.status === 'fail' ? 'not_built' : 'error';

    return {
      timestamp: new Date(),
      environment: platformProvider.getDetectedEnvironment(),
      checks,
      nodeVersion,
      npmVersion,
      buildStatus,
      criticalIssues: checks.filter(c => c.severity === 'critical' && c.status === 'fail').length,
      errors: checks.filter(c => c.severity === 'error' && c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warning').length,
      passed: checks.filter(c => c.status === 'pass').length,
    };
  }

  private printTextSummary(summary: PreflightSummary) {
    this.printHeader('🚀 DEPLOYMENT-DIAGNOSE');

    console.log(`\nZeitstempel: ${summary.timestamp.toLocaleString('de-DE')}`);
    console.log(`Node.js: ${summary.nodeVersion} | NPM: ${summary.npmVersion}`);
    console.log(`Hosting: ${COLORS.cyan}${summary.environment.type.toUpperCase()}${COLORS.reset}${summary.environment.detected ? ' ✓' : ' (nicht erkannt)'}`);
    console.log(`Build-Status: ${this.coloredBuildStatus(summary.buildStatus)}`);

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`\n📊 Zusammenfassung:`);
    console.log(`  ${COLORS.green}✓ ${summary.passed} erfolgreich${COLORS.reset}`);
    if (summary.warnings > 0) console.log(`  ${COLORS.yellow}⚠ ${summary.warnings} Warnungen${COLORS.reset}`);
    if (summary.errors > 0) console.log(`  ${COLORS.red}✗ ${summary.errors} Fehler${COLORS.reset}`);
    if (summary.criticalIssues > 0) console.log(`  ${COLORS.red}${COLORS.bright}⚠ ${summary.criticalIssues} KRITISCH${COLORS.reset}`);

    if (summary.criticalIssues > 0 || summary.errors > 0) {
      console.log(`\n❌ Kritische Probleme gefunden:`);
      summary.checks
        .filter(c => (c.severity === 'critical' || c.severity === 'error') && c.status === 'fail')
        .forEach(check => {
          console.log(`\n  ${COLORS.red}✗${COLORS.reset} ${COLORS.bright}${check.title}${COLORS.reset}`);
          console.log(`    ${check.message}`);
          if (check.remediation) {
            console.log(`    ${COLORS.cyan}→ Lösung:${COLORS.reset} ${check.remediation}`);
          }
          if (check.command) {
            console.log(`    ${COLORS.gray}$ ${check.command}${COLORS.reset}`);
          }
        });
    }

    console.log(`\n${'─'.repeat(80)}\n`);
    console.log(`💡 Führen Sie ${COLORS.cyan}npm run preflight:report${COLORS.reset} für einen detaillierten Bericht aus`);
    console.log(`💡 Führen Sie ${COLORS.cyan}npm run preflight:capture${COLORS.reset} für Server-Logs aus\n`);
  }

  private printDetailedReport(summary: PreflightSummary) {
    this.printHeader('📋 DETAILLIERTER DIAGNOSE-BERICHT');

    console.log(`\nZeitstempel: ${summary.timestamp.toLocaleString('de-DE')}`);
    console.log(`Node.js: ${summary.nodeVersion} | NPM: ${summary.npmVersion}`);
    console.log(`Hosting: ${summary.environment.type.toUpperCase()}${summary.environment.detected ? ' ✓' : ''}`);
    console.log(`Build-Status: ${this.coloredBuildStatus(summary.buildStatus)}`);

    const categories = [...new Set(summary.checks.map(c => c.category))];

    categories.forEach(category => {
      const categoryChecks = summary.checks.filter(c => c.category === category);
      
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`\n📁 ${category.toUpperCase()}\n`);

      categoryChecks.forEach(check => {
        const icon = this.getStatusIcon(check.status);
        const color = this.getStatusColor(check.status);
        
        console.log(`${color}${icon} ${check.title}${COLORS.reset}`);
        console.log(`  ${check.message}`);
        
        if (check.details && Object.keys(check.details).length > 0) {
          console.log(`  ${COLORS.gray}Details: ${JSON.stringify(check.details)}${COLORS.reset}`);
        }
        
        if (check.remediation) {
          console.log(`  ${COLORS.cyan}→ Lösung: ${check.remediation}${COLORS.reset}`);
        }
        
        if (check.command) {
          console.log(`  ${COLORS.gray}$ ${check.command}${COLORS.reset}`);
        }
        
        console.log('');
      });
    });

    console.log(`${'─'.repeat(80)}\n`);
  }

  private printHeader(title: string) {
    console.log(`\n${COLORS.bright}${COLORS.blue}${'═'.repeat(80)}${COLORS.reset}`);
    console.log(`${COLORS.bright}${COLORS.blue}  ${title}${COLORS.reset}`);
    console.log(`${COLORS.bright}${COLORS.blue}${'═'.repeat(80)}${COLORS.reset}`);
  }

  private coloredBuildStatus(status: string): string {
    switch (status) {
      case 'built': return `${COLORS.green}✓ Gebaut${COLORS.reset}`;
      case 'partial': return `${COLORS.yellow}⚠ Teilweise${COLORS.reset}`;
      case 'not_built': return `${COLORS.red}✗ Nicht gebaut${COLORS.reset}`;
      default: return `${COLORS.red}✗ Fehler${COLORS.reset}`;
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'pass': return '✓';
      case 'fail': return '✗';
      case 'warning': return '⚠';
      case 'skipped': return '○';
      default: return '?';
    }
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'pass': return COLORS.green;
      case 'fail': return COLORS.red;
      case 'warning': return COLORS.yellow;
      case 'skipped': return COLORS.gray;
      default: return COLORS.reset;
    }
  }

  private showHelp() {
    console.log(`
${COLORS.bright}${COLORS.cyan}Deployment Pre-Flight Check Tool${COLORS.reset}

${COLORS.bright}Verwendung:${COLORS.reset}
  npm run preflight [command] [options]

${COLORS.bright}Befehle:${COLORS.reset}
  check          Schnelle Diagnose (Standard)
  report         Detaillierter Bericht mit allen Checks
  detect-host    Hosting-Umgebung erkennen
  capture        Server- und Passenger-Logs erfassen
  help           Diese Hilfe anzeigen

${COLORS.bright}Optionen:${COLORS.reset}
  --json         Ausgabe im JSON-Format

${COLORS.bright}Beispiele:${COLORS.reset}
  npm run preflight                    # Schnelle Diagnose
  npm run preflight report             # Detaillierter Bericht
  npm run preflight detect-host        # Hosting-Umgebung prüfen
  npm run preflight capture            # Logs erfassen
  npm run preflight check --json       # JSON-Ausgabe

${COLORS.bright}Zweck:${COLORS.reset}
  Dieses Tool hilft bei der Fehlersuche vor dem Deployment,
  insbesondere bei Phusion Passenger und anderen Hosting-Umgebungen.
  Es prüft Build-Status, Konfiguration und Umgebungsvariablen.
`);
  }
}

// Run CLI
const cli = new PreflightCLI();
const args = process.argv.slice(2);
cli.run(args);
