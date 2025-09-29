import { Monitor, Wifi, Shield, Package, FileText, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  currentStep: string;
  onStepChange: (step: string) => void;
  progress: number;
  progressMessage: string;
}

export default function SidebarNav({ currentStep, onStepChange, progress, progressMessage }: SidebarNavProps) {
  const steps = [
    { id: "system", label: "System Check", icon: Monitor },
    { id: "network", label: "Netzwerk & Ports", icon: Wifi },
    { id: "permissions", label: "Berechtigungen", icon: Shield },
    { id: "dependencies", label: "Dependencies", icon: Package },
    { id: "fixes", label: "Lösungsvorschläge", icon: Wrench },
    { id: "logs", label: "Logs & Berichte", icon: FileText },
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
      <h2 className="text-lg font-semibold mb-4">Diagnose Schritte</h2>
      <nav className="space-y-2">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={cn(
                "w-full flex items-center p-3 rounded-md transition-colors text-left",
                currentStep === step.id 
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
              )}
              data-testid={`nav-${step.id}`}
            >
              <Icon className="w-4 h-4 mr-3" />
              {step.label}
            </button>
          );
        })}
      </nav>

      {/* Progress Overview */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="text-sm font-medium mb-3">Fortschritt</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Abgeschlossen</span>
            <span className="font-medium" data-testid="progress-percentage">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
              data-testid="progress-bar"
            />
          </div>
          {progressMessage && (
            <p className="text-xs text-muted-foreground" data-testid="progress-message">
              {progressMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
