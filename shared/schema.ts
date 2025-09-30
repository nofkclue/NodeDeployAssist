import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const diagnosticReports = pgTable("diagnostic_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").defaultNow(),
  systemInfo: jsonb("system_info"),
  networkTests: jsonb("network_tests"),
  permissionChecks: jsonb("permission_checks"),
  dependencyAnalysis: jsonb("dependency_analysis"),
  logs: text("logs"),
  aiReport: text("ai_report"),
  status: varchar("status", { length: 50 }).default("running"),
  progress: integer("progress").default(0),
});

export const systemChecks = pgTable("system_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => diagnosticReports.id),
  checkType: varchar("check_type", { length: 100 }),
  status: varchar("status", { length: 20 }),
  message: text("message"),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertDiagnosticReportSchema = createInsertSchema(diagnosticReports).omit({
  id: true,
  timestamp: true,
});

export const insertSystemCheckSchema = createInsertSchema(systemChecks).omit({
  id: true,
  timestamp: true,
});

export type InsertDiagnosticReport = z.infer<typeof insertDiagnosticReportSchema>;
export type DiagnosticReport = typeof diagnosticReports.$inferSelect;
export type InsertSystemCheck = z.infer<typeof insertSystemCheckSchema>;
export type SystemCheck = typeof systemChecks.$inferSelect;

// Types for diagnostic results
export type SystemInfo = {
  nodeVersion: string;
  npmVersion: string;
  os: string;
  architecture: string;
  cpuCores: number;
  totalMemory: number;
  freeMemory: number;
  diskTotal: number;
  diskUsed: number;
  diskAvailable: number;
  envVars: Record<string, string>;
};

export type NetworkTest = {
  portTests: Array<{
    port: number;
    available: boolean;
    pid?: number;
  }>;
  internetConnection: boolean;
  dnsResolution: boolean;
  firewallStatus: string;
};

export type PermissionCheck = {
  directoryStructure: Array<{
    path: string;
    permissions: string;
    exists: boolean;
    writable: boolean;
  }>;
  issues: Array<{
    type: string;
    message: string;
    solution: string;
  }>;
};

export type DependencyAnalysis = {
  packageJsonValid: boolean;
  hasStartScript: boolean;
  engineCompatible: boolean;
  lockFileExists: boolean;
  vulnerabilities: Array<{
    name: string;
    severity: string;
    description: string;
  }>;
  outdatedPackages: Array<{
    name: string;
    current: string;
    latest: string;
  }>;
};

// Fix suggestions types
export type FixSuggestion = {
  id: string;
  category: 'security' | 'performance' | 'compatibility' | 'configuration';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  command?: string;
  isExecutable: boolean;
  estimatedTime: string;
  impact: string;
};

export type FixExecutionResult = {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
};

// CLI Preflight Check Types
export type CheckCategory = 
  | 'system'
  | 'network' 
  | 'filesystem'
  | 'dependencies'
  | 'build'
  | 'platform'
  | 'deployment';

export type CheckSeverity = 
  | 'info'
  | 'warning'
  | 'error'
  | 'critical';

export type CheckResult = {
  id: string;
  category: CheckCategory;
  severity: CheckSeverity;
  title: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  message: string;
  details?: Record<string, any>;
  remediation?: string;
  command?: string;
  timestamp: Date;
};

export type HostingEnvironment = {
  type: 'passenger' | 'pm2' | 'systemd' | 'docker' | 'generic';
  detected: boolean;
  version?: string;
  configPath?: string;
  details?: Record<string, any>;
};

export type PreflightSummary = {
  timestamp: Date;
  environment: HostingEnvironment;
  checks: CheckResult[];
  nodeVersion: string;
  npmVersion: string;
  buildStatus: 'not_built' | 'built' | 'partial' | 'error';
  criticalIssues: number;
  errors: number;
  warnings: number;
  passed: number;
};
