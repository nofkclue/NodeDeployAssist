import type { CheckResult, CheckCategory, CheckSeverity } from "@shared/schema";

export interface CheckProvider {
  category: CheckCategory;
  runChecks(): Promise<CheckResult[]>;
}

export function createCheckResult(
  category: CheckCategory,
  data: {
    title: string;
    status: 'pass' | 'fail' | 'warning' | 'skipped';
    severity: CheckSeverity;
    message: string;
    details?: Record<string, any>;
    remediation?: string;
    command?: string;
  }
): CheckResult {
  return {
    id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category,
    timestamp: new Date(),
    ...data,
  };
}
