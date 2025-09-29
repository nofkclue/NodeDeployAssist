import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Play, 
  RefreshCw,
  Shield,
  Settings,
  Zap,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { FixSuggestion, FixExecutionResult } from "@shared/schema";

interface FixSuggestionsProps {
  reportId: string | undefined;
}

const getSeverityColors = (severity: string) => {
  switch (severity) {
    case 'critical': return { bg: 'bg-red-100', text: 'text-red-600', badge: 'bg-red-500' };
    case 'high': return { bg: 'bg-orange-100', text: 'text-orange-600', badge: 'bg-orange-500' };
    case 'medium': return { bg: 'bg-yellow-100', text: 'text-yellow-600', badge: 'bg-yellow-500' };
    case 'low': return { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-blue-500' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-600', badge: 'bg-gray-500' };
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'security': return Shield;
    case 'performance': return TrendingUp;
    case 'compatibility': return Zap;
    case 'configuration': return Settings;
    default: return AlertTriangle;
  }
};

const getSeverityText = (severity: string) => {
  switch (severity) {
    case 'critical': return 'Kritisch';
    case 'high': return 'Hoch';
    case 'medium': return 'Mittel';
    case 'low': return 'Niedrig';
    default: return 'Unbekannt';
  }
};

const getCategoryText = (category: string) => {
  switch (category) {
    case 'security': return 'Sicherheit';
    case 'performance': return 'Performance';
    case 'compatibility': return 'Kompatibilität';
    case 'configuration': return 'Konfiguration';
    default: return 'Allgemein';
  }
};

export function FixSuggestions({ reportId }: FixSuggestionsProps) {
  const { toast } = useToast();
  const [executingFixes, setExecutingFixes] = useState<Set<string>>(new Set());

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['/api/diagnosis', reportId, 'fix-suggestions'],
    enabled: !!reportId,
  });

  const executeFixMutation = useMutation({
    mutationFn: async ({ suggestionId }: { suggestionId: string }): Promise<FixExecutionResult> => {
      const response = await apiRequest(
        'POST',
        `/api/diagnosis/${reportId}/execute-fix`,
        { suggestionId }
      );
      return await response.json() as FixExecutionResult;
    },
    onMutate: async ({ suggestionId }) => {
      setExecutingFixes(prev => new Set(prev).add(suggestionId));
    },
    onSuccess: (result: FixExecutionResult, { suggestionId }) => {
      if (result.success) {
        toast({
          title: "Lösung erfolgreich ausgeführt",
          description: result.output,
          variant: "default",
        });
        // Invalidate both the report and fix suggestions to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/diagnosis', reportId] });
        queryClient.invalidateQueries({ queryKey: ['/api/diagnosis', reportId, 'fix-suggestions'] });
      } else {
        toast({
          title: "Ausführung fehlgeschlagen",
          description: result.error || "Unbekannter Fehler",
          variant: "destructive",
        });
      }
      setExecutingFixes(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
    },
    onError: (error, { suggestionId }) => {
      toast({
        title: "Fehler bei der Ausführung",
        description: `Unerwarteter Fehler: ${error}`,
        variant: "destructive",
      });
      setExecutingFixes(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
    }
  });

  if (!reportId) {
    return (
      <Card data-testid="fix-suggestions-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Lösungsvorschläge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Starte eine Diagnose, um automatische Lösungsvorschläge zu erhalten.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card data-testid="fix-suggestions-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Lösungsvorschläge werden generiert...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const fixSuggestions = suggestions as FixSuggestion[] || [];

  if (fixSuggestions.length === 0) {
    return (
      <Card data-testid="fix-suggestions-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Keine Probleme gefunden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ihre Serverumgebung scheint optimal konfiguriert zu sein. Es wurden keine kritischen Probleme gefunden, die behoben werden müssen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="fix-suggestions-list">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">
          Automatische Lösungsvorschläge ({fixSuggestions.length})
        </h3>
        <p className="text-sm text-muted-foreground">
          Basierend auf der Diagnose haben wir folgende Verbesserungen identifiziert:
        </p>
      </div>

      {fixSuggestions.map((suggestion) => {
        const CategoryIcon = getCategoryIcon(suggestion.category);
        const isExecuting = executingFixes.has(suggestion.id);

        return (
          <Card key={suggestion.id} data-testid={`fix-suggestion-${suggestion.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-full ${getSeverityColors(suggestion.severity).bg} flex-shrink-0`}>
                    <CategoryIcon className={`h-4 w-4 ${getSeverityColors(suggestion.severity).text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base leading-tight">
                        {suggestion.title}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`${getSeverityColors(suggestion.severity).badge} text-white border-0`}
                        data-testid={`severity-${suggestion.severity}`}
                      >
                        {getSeverityText(suggestion.severity)}
                      </Badge>
                      <Badge variant="secondary" data-testid={`category-${suggestion.category}`}>
                        {getCategoryText(suggestion.category)}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {suggestion.description}
                    </CardDescription>
                  </div>
                </div>
                {suggestion.isExecutable && (
                  <Button
                    onClick={() => executeFixMutation.mutate({ suggestionId: suggestion.id })}
                    disabled={isExecuting}
                    size="sm"
                    className="flex-shrink-0"
                    data-testid={`execute-fix-${suggestion.id}`}
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Wird ausgeführt...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Ausführen
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Dauer:</span>
                  <span data-testid={`estimated-time-${suggestion.id}`}>{suggestion.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Auswirkung:</span>
                  <span data-testid={`impact-${suggestion.id}`}>{suggestion.impact}</span>
                </div>
                {suggestion.command && (
                  <div className="md:col-span-3">
                    <Separator className="mb-3" />
                    <div className="bg-muted p-3 rounded-md">
                      <div className="text-xs text-muted-foreground mb-1">Kommando:</div>
                      <code 
                        className="text-xs font-mono bg-background px-2 py-1 rounded"
                        data-testid={`command-${suggestion.id}`}
                      >
                        {suggestion.command}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}