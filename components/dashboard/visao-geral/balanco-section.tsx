"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { ClipboardList } from "lucide-react";
import { BalancoPatrimonialTable } from "@/components/projections/balanco/balanco-patrimonial-table";

interface BalancoSectionRefactoredProps {
  organizationId: string;
  projectionId?: string;
  initialData: any;
  error: string | null;
}

export function BalancoSectionRefactored({ 
  organizationId, 
  projectionId,
  initialData,
  error
}: BalancoSectionRefactoredProps) {
  
  if (error) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<ClipboardList className="h-4 w-4" />}
          title="Balanço Patrimonial"
          description={projectionId ? "Visão patrimonial baseada no cenário selecionado" : "Visão consolidada do patrimônio da empresa por período"}
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
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<ClipboardList className="h-4 w-4" />}
          title="Balanço Patrimonial"
          description={projectionId ? "Visão patrimonial baseada no cenário selecionado" : "Visão consolidada do patrimônio da empresa por período"}
        />
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">Nenhum dado disponível para exibição.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return <BalancoPatrimonialTable organizationId={organizationId} initialData={initialData} />;
}