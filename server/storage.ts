import { 
  type DiagnosticReport, 
  type InsertDiagnosticReport, 
  type SystemCheck, 
  type InsertSystemCheck,
  diagnosticReports,
  systemChecks
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Diagnostic Reports
  createDiagnosticReport(report: InsertDiagnosticReport): Promise<DiagnosticReport>;
  getDiagnosticReport(id: string): Promise<DiagnosticReport | undefined>;
  updateDiagnosticReport(id: string, updates: Partial<DiagnosticReport>): Promise<DiagnosticReport>;
  getAllDiagnosticReports(): Promise<DiagnosticReport[]>;
  
  // System Checks
  createSystemCheck(check: InsertSystemCheck): Promise<SystemCheck>;
  getSystemChecksByReportId(reportId: string): Promise<SystemCheck[]>;
}

export class DatabaseStorage implements IStorage {
  async createDiagnosticReport(insertReport: InsertDiagnosticReport): Promise<DiagnosticReport> {
    const [report] = await db
      .insert(diagnosticReports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getDiagnosticReport(id: string): Promise<DiagnosticReport | undefined> {
    const [report] = await db.select().from(diagnosticReports).where(eq(diagnosticReports.id, id));
    return report || undefined;
  }

  async updateDiagnosticReport(id: string, updates: Partial<DiagnosticReport>): Promise<DiagnosticReport> {
    const [report] = await db
      .update(diagnosticReports)
      .set(updates)
      .where(eq(diagnosticReports.id, id))
      .returning();
    if (!report) {
      throw new Error(`Diagnostic report with id ${id} not found`);
    }
    return report;
  }

  async getAllDiagnosticReports(): Promise<DiagnosticReport[]> {
    return await db.select().from(diagnosticReports).orderBy(desc(diagnosticReports.timestamp));
  }

  async createSystemCheck(insertCheck: InsertSystemCheck): Promise<SystemCheck> {
    const [check] = await db
      .insert(systemChecks)
      .values(insertCheck)
      .returning();
    return check;
  }

  async getSystemChecksByReportId(reportId: string): Promise<SystemCheck[]> {
    return await db.select().from(systemChecks).where(eq(systemChecks.reportId, reportId));
  }
}

export class MemStorage implements IStorage {
  private diagnosticReports: Map<string, DiagnosticReport>;
  private systemChecks: Map<string, SystemCheck>;

  constructor() {
    this.diagnosticReports = new Map();
    this.systemChecks = new Map();
  }

  async createDiagnosticReport(insertReport: InsertDiagnosticReport): Promise<DiagnosticReport> {
    const id = randomUUID();
    const report: DiagnosticReport = {
      id,
      timestamp: new Date(),
      systemInfo: null,
      networkTests: null,
      permissionChecks: null,
      dependencyAnalysis: null,
      logs: null,
      aiReport: null,
      status: "running",
      progress: 0,
      ...insertReport,
    };
    this.diagnosticReports.set(id, report);
    return report;
  }

  async getDiagnosticReport(id: string): Promise<DiagnosticReport | undefined> {
    return this.diagnosticReports.get(id);
  }

  async updateDiagnosticReport(id: string, updates: Partial<DiagnosticReport>): Promise<DiagnosticReport> {
    const existing = this.diagnosticReports.get(id);
    if (!existing) {
      throw new Error(`Diagnostic report with id ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.diagnosticReports.set(id, updated);
    return updated;
  }

  async getAllDiagnosticReports(): Promise<DiagnosticReport[]> {
    return Array.from(this.diagnosticReports.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async createSystemCheck(insertCheck: InsertSystemCheck): Promise<SystemCheck> {
    const id = randomUUID();
    const check: SystemCheck = {
      id,
      timestamp: new Date(),
      reportId: null,
      checkType: null,
      status: null,
      message: null,
      details: null,
      ...insertCheck,
    };
    this.systemChecks.set(id, check);
    return check;
  }

  async getSystemChecksByReportId(reportId: string): Promise<SystemCheck[]> {
    return Array.from(this.systemChecks.values())
      .filter(check => check.reportId === reportId)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }
}

export const storage = new DatabaseStorage();
