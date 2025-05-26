import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null | undefined;
  copyable?: boolean;
  link?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function InfoField({ 
  icon, 
  label, 
  value, 
  copyable = true, 
  link = false, 
  className = "",
  children 
}: InfoFieldProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`${field} copiado para a área de transferência.`);

    setTimeout(() => {
      setCopied(null);
    }, 2000);
  };

  if (!value && !children) return null;

  return (
    <div className={`group relative bg-card border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-primary/20 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <div className="flex items-center gap-2">
            {children ? (
              children
            ) : link && value ? (
              <a
                href={value.startsWith("http") ? value : `https://${value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-medium"
              >
                {value} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="font-medium text-foreground break-words">{value}</p>
            )}

            {copyable && value && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => copyToClipboard(value, label)}
                    >
                      <Copy
                        className={`h-3.5 w-3.5 ${
                          copied === label
                            ? "text-green-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className="sr-only">Copiar {label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copied === label ? "Copiado!" : "Copiar"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
