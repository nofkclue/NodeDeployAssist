import os from 'os';
import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);
const readFile = promisify(fs.readFile);

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    connections: number;
    ports: {
      listening: number;
      established: number;
    };
  };
  processes: {
    total: number;
    running: number;
    sleeping: number;
  };
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'process';
  title: string;
  message: string;
  timestamp: number;
  value?: number;
  threshold?: number;
}

export class MonitoringService {
  private alerts: Alert[] = [];
  private metricsHistory: SystemMetrics[] = [];
  private maxHistoryLength = 100; // Keep last 100 data points

  async collectMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();
    
    try {
      const [cpuUsage, diskStats, networkStats, processStats] = await Promise.all([
        this.getCPUUsage(),
        this.getDiskUsage(),
        this.getNetworkStats(),
        this.getProcessStats()
      ]);

      const memory = this.getMemoryStats();
      const loadAvg = os.loadavg();

      const metrics: SystemMetrics = {
        timestamp,
        cpu: {
          usage: cpuUsage,
          loadAverage: loadAvg,
          cores: os.cpus().length
        },
        memory,
        disk: diskStats,
        network: networkStats,
        processes: processStats
      };

      // Add to history and trim if necessary
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.maxHistoryLength) {
        this.metricsHistory.shift();
      }

      // Check for alerts
      this.checkAlerts(metrics);

      return metrics;
    } catch (error) {
      console.error('Error collecting metrics:', error);
      throw error;
    }
  }

  private async getCPUUsage(): Promise<number> {
    try {
      // Calculate CPU usage over a short interval
      const stats1 = this.getCPUTimes();
      await new Promise(resolve => setTimeout(resolve, 100));
      const stats2 = this.getCPUTimes();

      const idle1 = stats1.idle;
      const total1 = stats1.total;
      const idle2 = stats2.idle;
      const total2 = stats2.total;

      const idleDiff = idle2 - idle1;
      const totalDiff = total2 - total1;

      return Math.max(0, Math.min(100, 100 - (100 * idleDiff / totalDiff)));
    } catch {
      return 0;
    }
  }

  private getCPUTimes() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        total += (cpu.times as any)[type];
      }
      idle += cpu.times.idle;
    });

    return { idle, total };
  }

  private getMemoryStats() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      total: Math.round(totalMemory / (1024 * 1024 * 1024) * 100) / 100, // GB
      used: Math.round(usedMemory / (1024 * 1024 * 1024) * 100) / 100,   // GB
      free: Math.round(freeMemory / (1024 * 1024 * 1024) * 100) / 100,   // GB
      percentage: Math.round((usedMemory / totalMemory) * 100)
    };
  }

  private async getDiskUsage() {
    try {
      const { stdout } = await execAsync('df -h / | tail -1 | awk \'{print $2 " " $3 " " $4 " " $5}\'');
      const [total, used, free, percentageStr] = stdout.trim().split(' ');

      return {
        total: this.parseDiskSize(total),
        used: this.parseDiskSize(used),
        free: this.parseDiskSize(free),
        percentage: parseInt(percentageStr.replace('%', ''))
      };
    } catch {
      return { total: 0, used: 0, free: 0, percentage: 0 };
    }
  }

  private parseDiskSize(sizeStr: string): number {
    const size = parseFloat(sizeStr);
    const unit = sizeStr.slice(-1).toUpperCase();
    
    switch (unit) {
      case 'T': return size * 1024;
      case 'G': return size;
      case 'M': return size / 1024;
      case 'K': return size / (1024 * 1024);
      default: return size;
    }
  }

  private async getNetworkStats() {
    try {
      const { stdout } = await execAsync('netstat -tuln | wc -l');
      const totalConnections = parseInt(stdout.trim()) - 2; // Remove header lines

      const { stdout: listening } = await execAsync('netstat -tuln | grep LISTEN | wc -l');
      const { stdout: established } = await execAsync('netstat -tun | grep ESTABLISHED | wc -l');

      return {
        connections: totalConnections,
        ports: {
          listening: parseInt(listening.trim()),
          established: parseInt(established.trim())
        }
      };
    } catch {
      return {
        connections: 0,
        ports: { listening: 0, established: 0 }
      };
    }
  }

  private async getProcessStats() {
    try {
      const { stdout } = await execAsync('ps aux | tail -n +2 | wc -l');
      const total = parseInt(stdout.trim());

      const { stdout: running } = await execAsync('ps aux | grep -v grep | grep " R " | wc -l');
      const { stdout: sleeping } = await execAsync('ps aux | grep -v grep | grep " S " | wc -l');

      return {
        total,
        running: parseInt(running.trim()),
        sleeping: parseInt(sleeping.trim())
      };
    } catch {
      return { total: 0, running: 0, sleeping: 0 };
    }
  }

  private checkAlerts(metrics: SystemMetrics) {
    const now = Date.now();
    const newAlerts: Alert[] = [];

    // CPU usage alerts
    if (metrics.cpu.usage > 80) {
      newAlerts.push({
        id: `cpu-high-${now}`,
        type: 'warning',
        category: 'cpu',
        title: 'Hohe CPU Auslastung',
        message: `CPU Auslastung bei ${metrics.cpu.usage.toFixed(1)}%`,
        timestamp: now,
        value: metrics.cpu.usage,
        threshold: 80
      });
    }

    // Memory usage alerts
    if (metrics.memory.percentage > 85) {
      newAlerts.push({
        id: `memory-high-${now}`,
        type: 'error',
        category: 'memory',
        title: 'Kritischer Speicherverbrauch',
        message: `Speicher zu ${metrics.memory.percentage}% belegt`,
        timestamp: now,
        value: metrics.memory.percentage,
        threshold: 85
      });
    } else if (metrics.memory.percentage > 70) {
      newAlerts.push({
        id: `memory-warning-${now}`,
        type: 'warning',
        category: 'memory',
        title: 'Hoher Speicherverbrauch',
        message: `Speicher zu ${metrics.memory.percentage}% belegt`,
        timestamp: now,
        value: metrics.memory.percentage,
        threshold: 70
      });
    }

    // Disk usage alerts
    if (metrics.disk.percentage > 90) {
      newAlerts.push({
        id: `disk-critical-${now}`,
        type: 'error',
        category: 'disk',
        title: 'Festplatte fast voll',
        message: `Festplatte zu ${metrics.disk.percentage}% belegt`,
        timestamp: now,
        value: metrics.disk.percentage,
        threshold: 90
      });
    }

    // Load average alerts (for CPU cores)
    const loadAvgPerCore = metrics.cpu.loadAverage[0] / metrics.cpu.cores;
    if (loadAvgPerCore > 2) {
      newAlerts.push({
        id: `load-high-${now}`,
        type: 'warning',
        category: 'cpu',
        title: 'Hohe Systemlast',
        message: `Load Average: ${metrics.cpu.loadAverage[0].toFixed(2)} bei ${metrics.cpu.cores} Kernen`,
        timestamp: now,
        value: loadAvgPerCore,
        threshold: 2
      });
    }

    // Add new alerts and trim old ones
    this.alerts.push(...newAlerts);
    
    // Keep only last 50 alerts and remove alerts older than 1 hour
    const oneHourAgo = now - (60 * 60 * 1000);
    this.alerts = this.alerts
      .filter(alert => alert.timestamp > oneHourAgo)
      .slice(-50);
  }

  getMetricsHistory(): SystemMetrics[] {
    return this.metricsHistory;
  }

  getAlerts(): Alert[] {
    return this.alerts.slice().reverse(); // Most recent first
  }

  clearAlerts() {
    this.alerts = [];
  }

  getLatestMetrics(): SystemMetrics | null {
    return this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1] 
      : null;
  }
}

export const monitoringService = new MonitoringService();