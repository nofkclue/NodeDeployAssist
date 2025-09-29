import { RefreshCw, Shield, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QuickActionsProps {
  reportId: string | null;
}

export default function QuickActions({ reportId }: QuickActionsProps) {
  const { toast } = useToast();

  const handleQuickAction = (action: string) => {
    toast({
      title: "Aktion gestartet",
      description: `${action} wird ausgeführt...`,
    });
    // In a real implementation, these would trigger actual system commands
  };

  const quickActions = [
    {
      id: "full-diagnosis",
      title: "Vollständige Diagnose",
      description: "Alle Tests erneut ausführen",
      icon: RefreshCw,
      action: () => handleQuickAction("Vollständige Diagnose"),
    },
    {
      id: "fix-permissions",
      title: "Berechtigungen reparieren",
      description: "Automatische Korrektur",
      icon: Shield,
      action: () => handleQuickAction("Berechtigungen reparieren"),
    },
    {
      id: "update-dependencies",
      title: "Dependencies aktualisieren",
      description: "npm update ausführen",
      icon: Package,
      action: () => handleQuickAction("Dependencies aktualisieren"),
    },
    {
      id: "clear-cache",
      title: "Cache leeren",
      description: "node_modules & cache",
      icon: Trash2,
      action: () => handleQuickAction("Cache leeren"),
    },
  ];

  return (
    <section className="bg-card rounded-lg border border-border p-6" data-testid="quick-actions-section">
      <h2 className="text-lg font-semibold mb-4">Schnellaktionen</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.action}
              disabled={!reportId}
              className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid={`quick-action-${action.id}`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{action.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
