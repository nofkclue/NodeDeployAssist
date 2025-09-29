import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Wifi, RefreshCw, Globe, Server, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { NetworkTest } from "@shared/schema";

interface NetworkCheckProps {
  reportId: string | null;
  data: NetworkTest | null;
}

export default function NetworkCheck({ reportId, data }: NetworkCheckProps) {
  const { toast } = useToast();

  const runNetworkCheck = useMutation({
    mutationFn: async () => {
      if (!reportId) throw new Error("No active report");
      const response = await apiRequest("POST", `/api/diagnosis/${reportId}/network-check`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagnosis', reportId] });
      toast({
        title: "Netzwerk Check abgeschlossen",
        description: "Die Netzwerkverbindung wurde erfolgreich getestet.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Netzwerk Check fehlgeschlagen: ${error}`,
        variant: "destructive",
      });
    },
  });

  return (
    <section className="bg-card rounded-lg border border-border p-6" data-testid="network-check-section">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Wifi className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Netzwerk & Ports</h2>
            <p className="text-muted-foreground">Konnektivität und Port-Verfügbarkeit</p>
          </div>
        </div>
        <Button
          onClick={() => runNetworkCheck.mutate()}
          disabled={!reportId || runNetworkCheck.isPending}
          data-testid="button-test-network"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${runNetworkCheck.isPending ? 'animate-spin' : ''}`} />
          Ports testen
        </Button>
      </div>

      {data ? (
        <div className="space-y-4">
          {/* Port Tests */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">Port Verfügbarkeit</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {data.portTests.map((test, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    test.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                  data-testid={`port-${test.port}`}
                >
                  <span className="text-sm font-medium">Port {test.port}</span>
                  <span className={`text-xs ${test.available ? 'text-green-600' : 'text-red-600'}`}>
                    {test.available ? '✓ Verfügbar' : `✗ Belegt${test.pid ? ` (PID: ${test.pid})` : ''}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Network Connectivity */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">Netzwerk Konnektivität</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border rounded">
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Internet Verbindung</span>
                </div>
                <span className={`text-xs ${data.internetConnection ? 'text-green-600' : 'text-red-600'}`}>
                  {data.internetConnection ? '✓ Verbunden' : '✗ Nicht verbunden'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-border rounded">
                <div className="flex items-center space-x-3">
                  <Server className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">DNS Auflösung</span>
                </div>
                <span className={`text-xs ${data.dnsResolution ? 'text-green-600' : 'text-red-600'}`}>
                  {data.dnsResolution ? '✓ Funktioniert' : '✗ Probleme'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-border rounded">
                <div className="flex items-center space-x-3">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Firewall Status</span>
                </div>
                <span className="text-xs text-yellow-600">⚠ {data.firewallStatus}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Wifi className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Keine Netzwerkdaten verfügbar. Starten Sie eine neue Diagnose.</p>
        </div>
      )}
    </section>
  );
}
