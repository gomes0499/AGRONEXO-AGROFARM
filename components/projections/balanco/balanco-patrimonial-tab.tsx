"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { ClipboardList } from "lucide-react";
import { getBalancoPatrimonialData } from "@/lib/actions/projections-actions/balanco-patrimonial-data";
import { BalancoPatrimonialTable } from "./balanco-patrimonial-table";
import { Skeleton } from "@/components/ui/skeleton";

interface BalancoPatrimonialTabProps {
  organizationId: string;
}

export function BalancoPatrimonialTab({ organizationId }: BalancoPatrimonialTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balancoData, setBalancoData] = useState<any>(null);

  useEffect(() => {
    async function loadBalancoData() {
      if (!organizationId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await getBalancoPatrimonialData(organizationId);
        setBalancoData(data);
      } catch (err) {
        console.error("Erro ao carregar dados do Balanço Patrimonial:", err);
        setError("Não foi possível carregar os dados do Balanço Patrimonial. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }
    
    loadBalancoData();
  }, [organizationId]);
  
  if (loading) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<ClipboardList className="h-4 w-4" />}
          title="Balanço Patrimonial"
          description="Visão consolidada do patrimônio da empresa por período"
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
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<ClipboardList className="h-4 w-4" />}
          title="Balanço Patrimonial"
          description="Visão consolidada do patrimônio da empresa por período"
        />
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!balancoData) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<ClipboardList className="h-4 w-4" />}
          title="Balanço Patrimonial"
          description="Visão consolidada do patrimônio da empresa por período"
        />
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">Nenhum dado disponível para exibição.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return <BalancoPatrimonialTable data={balancoData} />;
}