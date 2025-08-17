"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Warehouse, Package, Wheat, TrendingUp, BarChart3 } from "lucide-react";
import { getStorages } from "@/lib/actions/storage-actions";
import { formatNumber } from "@/lib/utils/formatters";

interface StorageMetricsProps {
  organizationId: string;
}

interface KpiItemProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  icon: React.ReactNode;
}

function KpiItem({ title, value, subtitle, change, icon }: KpiItemProps) {
  return (
    <div className="flex items-start p-5 transition-colors">
      <div className="rounded-full p-2 mr-3 bg-primary">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl font-bold mt-1 dark:text-gray-100">
          {value}
        </h3>
        {subtitle && (
          <p className="text-sm font-medium text-muted-foreground">
            {subtitle}
          </p>
        )}
        {change && (
          <p className="text-xs font-medium mt-1 text-muted-foreground">
            {change}
          </p>
        )}
      </div>
    </div>
  );
}

export function StorageMetrics({ organizationId }: StorageMetricsProps) {
  const [storages, setStorages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      const data = await getStorages(organizationId);
      setStorages(data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const totalSacas = storages
    .filter(s => s.tipo_armazenagem === 'graos')
    .reduce((sum, s) => sum + (s.capacidade_sacas || 0), 0);

  const totalFardos = storages
    .filter(s => s.tipo_armazenagem === 'algodao')
    .reduce((sum, s) => sum + (s.capacidade_fardos || 0), 0);

  const totalArmazensGraos = storages.filter(s => s.tipo_armazenagem === 'graos').length;
  const totalArmazensAlgodao = storages.filter(s => s.tipo_armazenagem === 'algodao').length;
  const totalComBeneficiamento = storages.filter(s => s.possui_beneficiamento).length;

  // Conversão para toneladas
  const toneladasGraos = (totalSacas * 60) / 1000; // Assumindo saca de 60kg
  const toneladasAlgodao = (totalFardos * 227) / 1000; // Fardo de 227kg

  const taxaBeneficiamento = storages.length > 0 
    ? Math.round((totalComBeneficiamento / storages.length) * 100)
    : 0;

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Capacidade de Armazenagem
              </CardTitle>
              <CardDescription className="text-white/80">
                Carregando métricas...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">
              Capacidade de Armazenagem
            </CardTitle>
            <CardDescription className="text-white/80">
              Visão geral da capacidade de armazenagem nas propriedades
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {/* Capacidade Grãos */}
        <div className="relative">
          <KpiItem
            title="Capacidade Grãos"
            value={formatNumber(totalSacas, 0)}
            subtitle="sacas"
            change={`${formatNumber(toneladasGraos, 0)} toneladas • ${totalArmazensGraos} armazéns`}
            icon={<Wheat className="h-5 w-5 text-white" />}
          />
          {/* Separator */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-px bg-border lg:block hidden" />
        </div>

        {/* Capacidade Algodão */}
        <div className="relative">
          <KpiItem
            title="Capacidade Algodão"
            value={formatNumber(totalFardos, 0)}
            subtitle="fardos"
            change={`${formatNumber(toneladasAlgodao, 0)} toneladas • ${totalArmazensAlgodao} armazéns`}
            icon={<Package className="h-5 w-5 text-white" />}
          />
          {/* Separator */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-px bg-border lg:block hidden" />
        </div>

        {/* Total de Armazéns */}
        <div className="relative">
          <KpiItem
            title="Total de Armazéns"
            value={storages.length.toString()}
            subtitle="unidades"
            change={`${totalComBeneficiamento} com beneficiamento`}
            icon={<Warehouse className="h-5 w-5 text-white" />}
          />
          {/* Separator */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-px bg-border lg:block hidden" />
        </div>

        {/* Taxa de Beneficiamento */}
        <div className="relative">
          <KpiItem
            title="Taxa de Beneficiamento"
            value={`${taxaBeneficiamento}%`}
            subtitle=""
            change={`${totalComBeneficiamento} de ${storages.length} armazéns`}
            icon={<TrendingUp className="h-5 w-5 text-white" />}
          />
        </div>
      </div>
    </Card>
  );
}