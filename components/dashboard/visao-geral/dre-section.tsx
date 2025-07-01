"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FileText } from "lucide-react";
import { DRETable } from "@/components/projections/dre/dre-table";

interface DRESectionRefactoredProps {
  organizationId: string;
  projectionId?: string;
  initialData: any;
  error: string | null;
}

export function DRESectionRefactored({ 
  organizationId, 
  projectionId,
  initialData,
  error
}: DRESectionRefactoredProps) {
  
  if (error) {
    return (
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<FileText className="h-4 w-4" />}
          title="Demonstração de Resultado do Exercício (DRE)"
          description={projectionId ? "Análise de resultados baseada no cenário selecionado" : "Análise consolidada de receitas, custos e resultados por período"}
        />
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!initialData) {
    return (
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<FileText className="h-4 w-4" />}
          title="Demonstração de Resultado do Exercício (DRE)"
          description={projectionId ? "Análise de resultados baseada no cenário selecionado" : "Análise consolidada de receitas, custos e resultados por período"}
        />
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">Nenhum dado disponível para exibição.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return <DRETable organizationId={organizationId} initialData={initialData} />;
}