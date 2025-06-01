"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FileText } from "lucide-react";
import { getDREData } from "@/lib/actions/projections-actions/dre-data";
import { DRETable } from "./dre-table";
import { Skeleton } from "@/components/ui/skeleton";

interface DRETabProps {
  organizationId: string;
}

export function DRETab({ organizationId }: DRETabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dreData, setDreData] = useState<any>(null);

  useEffect(() => {
    async function loadDREData() {
      if (!organizationId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await getDREData(organizationId);
        setDreData(data);
      } catch (err) {
        console.error("Erro ao carregar dados do DRE:", err);
        setError("Não foi possível carregar os dados do DRE. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }
    
    loadDREData();
  }, [organizationId]);
  
  if (loading) {
    return (
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<FileText className="h-4 w-4" />}
          title="Demonstração de Resultado do Exercício (DRE)"
          description="Análise consolidada de receitas, custos e resultados por período"
        />
        <CardContent className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<FileText className="h-4 w-4" />}
          title="Demonstração de Resultado do Exercício (DRE)"
          description="Análise consolidada de receitas, custos e resultados por período"
        />
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!dreData) {
    return (
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<FileText className="h-4 w-4" />}
          title="Demonstração de Resultado do Exercício (DRE)"
          description="Análise consolidada de receitas, custos e resultados por período"
        />
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">Nenhum dado disponível para exibição.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return <DRETable data={dreData} />;
}