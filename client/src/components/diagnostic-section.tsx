import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DiagnosticSectionProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  "data-testid"?: string;
}

export default function DiagnosticSection({ 
  icon, 
  title, 
  description, 
  children, 
  actions,
  className,
  "data-testid": testId 
}: DiagnosticSectionProps) {
  return (
    <section 
      className={cn("bg-card rounded-lg border border-border p-6", className)}
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
