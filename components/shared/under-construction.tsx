"use client";

import { Wrench, FileCode, ArrowLeft, Database, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface UnderConstructionProps {
  title?: string;
  message?: string;
  variant?: "default" | "no-data" | "coming-soon" | "maintenance";
  icon?: "code" | "database" | "wrench" | "alert";
  className?: string;
  showBackButton?: boolean;
  children?: React.ReactNode;
}

export function UnderConstruction({
  title,
  message,
  variant = "default",
  icon = "code",
  className,
  showBackButton = true,
  children,
}: UnderConstructionProps) {
  const router = useRouter();
  
  // Determinar título e mensagem com base na variante
  let defaultTitle = "Página em Construção";
  let defaultMessage = "Estamos trabalhando para implementar esta funcionalidade em breve.";
  
  if (variant === "no-data") {
    defaultTitle = "Dados Insuficientes";
    defaultMessage = "Não há dados suficientes para implementar esta funcionalidade no momento.";
    icon = icon === "code" ? "database" : icon;
  } else if (variant === "coming-soon") {
    defaultTitle = "Em Breve";
    defaultMessage = "Esta funcionalidade estará disponível em breve. Estamos trabalhando nela!";
  } else if (variant === "maintenance") {
    defaultTitle = "Em Manutenção";
    defaultMessage = "Esta funcionalidade está temporariamente indisponível devido a manutenção.";
    icon = icon === "code" ? "wrench" : icon;
  }
  
  // Usar valores padrão ou personalizados
  const displayTitle = title || defaultTitle;
  const displayMessage = message || defaultMessage;

  // Renderizar ícone apropriado
  const renderIcon = () => {
    switch (icon) {
      case "database":
        return (
          <div className="relative">
            <Database className="h-24 w-24 text-muted-foreground opacity-20" />
            <AlertCircle className="absolute right-0 top-0 h-10 w-10 text-amber-500" />
          </div>
        );
      case "wrench":
        return (
          <div className="relative">
            <Wrench className="h-24 w-24 text-muted-foreground opacity-20" />
          </div>
        );
      case "alert":
        return (
          <div className="relative">
            <AlertCircle className="h-24 w-24 text-muted-foreground opacity-20" />
          </div>
        );
      case "code":
      default:
        return (
          <div className="relative">
            <FileCode className="h-24 w-24 text-muted-foreground opacity-20" />
            <Wrench className="absolute right-0 top-0 h-10 w-10 text-primary" />
          </div>
        );
    }
  };

  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center p-6", className)}>
      <Card className="max-w-md border-dashed">
        <CardContent className="pt-6">
          <div className="mb-4 flex justify-center">
            {renderIcon()}
          </div>
          <h2 className="mb-2 text-center text-2xl font-bold">{displayTitle}</h2>
          <p className="text-center text-muted-foreground">{displayMessage}</p>
          {children && <div className="mt-4">{children}</div>}
        </CardContent>
        {showBackButton && (
          <CardFooter className="flex justify-center pb-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}