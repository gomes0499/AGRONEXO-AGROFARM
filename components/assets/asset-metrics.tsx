"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { 
  Home,
  Wrench,
  TrendingUp,
  MapPin,
  BarChart3,
  Building2,
  Percent,
  Info,
  Loader2
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils/formatters";
import { formatArea } from "@/lib/utils/property-formatters";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface Property {
  id: string;
  nome: string;
  tipo: string;
  area_total: number;
  area_cultivada: number;
  valor_atual: number;
  avaliacao_banco?: number;
}

interface Equipment {
  id: string;
  equipamento: string;
  marca: string;
  modelo: string;
  ano_fabricacao: number;
  alienado: boolean;
  valor_unitario: number;
  quantidade: number;
  valor_total: number;
}

interface Investment {
  id: string;
  categoria: string;
  tipo: string;
  ano: number;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

interface Improvement {
  id: string;
  descricao: string;
  propriedade_id: string;
  dimensoes: string;
  valor: number;
}

interface AssetMetricsProps {
  properties: Property[];
  equipments: Equipment[];
  investments: Investment[];
  improvements: Improvement[];
}

interface KpiItemProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  tooltip?: string;
}

function KpiItem({
  title,
  value,
  change,
  isPositive,
  icon,
  loading,
  tooltip,
}: KpiItemProps) {
  return (
    <div className="flex items-start p-5 transition-colors">
      <div className="rounded-full p-2 mr-3 bg-primary">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-background dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {loading ? (
          <div className="flex items-center mt-1">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold mt-1 dark:text-gray-100">
              {value}
            </h3>
            <p className="text-xs font-medium mt-1 text-muted-foreground">
              {change}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function AssetMetrics({ 
  properties = [], 
  equipments = [], 
  investments = [],
  improvements = []
}: AssetMetricsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalPatrimonio: 0,
    totalPropriedades: 0,
    totalEquipamentos: 0,
    totalInvestimentos: 0,
    totalBenfeitorias: 0,
    areaTotal: 0,
    areaCultivada: 0,
    taxaUtilizacao: 0,
    numeroPropriedades: 0,
    numeroEquipamentos: 0,
    equipamentosAlienados: 0,
    propriedadesProprias: 0,
    propriedadesArrendadas: 0,
  });

  useEffect(() => {
    try {
      // Garantir que temos arrays válidos
      const validProperties = Array.isArray(properties) ? properties : [];
      const validEquipments = Array.isArray(equipments) ? equipments : [];
      const validInvestments = Array.isArray(investments) ? investments : [];
      const validImprovements = Array.isArray(improvements) ? improvements : [];

      // Calcular total de propriedades
      const totalPropriedades = validProperties.reduce((sum, prop) => {
        return sum + (prop.valor_atual || 0);
      }, 0);

      // Calcular áreas
      const areaTotal = validProperties.reduce((sum, prop) => {
        return sum + (prop.area_total || 0);
      }, 0);

      const areaCultivada = validProperties.reduce((sum, prop) => {
        return sum + (prop.area_cultivada || 0);
      }, 0);

      // Taxa de utilização
      const taxaUtilizacao = areaTotal > 0 ? (areaCultivada / areaTotal) * 100 : 0;

      // Contar propriedades por tipo
      const propriedadesProprias = validProperties.filter(p => p.tipo === 'PROPRIO').length;
      const propriedadesArrendadas = validProperties.filter(p => p.tipo === 'ARRENDADO').length;

      // Calcular total de equipamentos
      const totalEquipamentos = validEquipments.reduce((sum, equip) => {
        return sum + (equip.valor_total || 0);
      }, 0);

      // Contar equipamentos alienados
      const equipamentosAlienados = validEquipments.filter(e => e.alienado).length;

      // Calcular total de investimentos realizados
      const totalInvestimentos = validInvestments
        .filter(inv => inv.tipo === 'REALIZADO')
        .reduce((sum, inv) => {
          return sum + (inv.valor_total || 0);
        }, 0);

      // Calcular total de benfeitorias
      const totalBenfeitorias = validImprovements.reduce((sum, imp) => {
        return sum + (imp.valor || 0);
      }, 0);

      // Total do patrimônio
      const totalPatrimonio = totalPropriedades + totalEquipamentos + totalInvestimentos + totalBenfeitorias;

      setMetrics({
        totalPatrimonio,
        totalPropriedades,
        totalEquipamentos,
        totalInvestimentos,
        totalBenfeitorias,
        areaTotal,
        areaCultivada,
        taxaUtilizacao,
        numeroPropriedades: validProperties.length,
        numeroEquipamentos: validEquipments.length,
        equipamentosAlienados,
        propriedadesProprias,
        propriedadesArrendadas,
      });
    } catch (error) {
      console.error('Erro ao calcular métricas de patrimônio:', error);
    } finally {
      setIsLoading(false);
    }
  }, [properties, equipments, investments, improvements]);

  if (isLoading) {
    return (
      <TooltipProvider>
        <Card className="mb-6">
          <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Métricas de Patrimônio
                </CardTitle>
                <CardDescription className="text-white/80">
                  Carregando métricas...
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Card className="mb-6">
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Métricas de Patrimônio
              </CardTitle>
              <CardDescription className="text-white/80">
                Visão consolidada dos ativos e investimentos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Patrimônio Total */}
          <div className="relative">
            <KpiItem
              title="Patrimônio Total"
              value={formatCurrency(metrics.totalPatrimonio, 0)}
              change="Valor de todos os ativos"
              isPositive={true}
              icon={<TrendingUp className="h-5 w-5 text-white" />}
              tooltip="Soma de propriedades, equipamentos, investimentos e benfeitorias"
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Valor Propriedades */}
          <div className="relative">
            <KpiItem
              title="Valor Propriedades"
              value={formatCurrency(metrics.totalPropriedades, 0)}
              change={`${metrics.numeroPropriedades} propriedade${metrics.numeroPropriedades !== 1 ? 's' : ''}`}
              isPositive={true}
              icon={<Home className="h-5 w-5 text-white" />}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Área Total */}
          <div className="relative">
            <KpiItem
              title="Área Total"
              value={formatArea(metrics.areaTotal)}
              change={`${formatPercent(metrics.taxaUtilizacao)} cultivada`}
              isPositive={true}
              icon={<MapPin className="h-5 w-5 text-white" />}
              tooltip="Área total das propriedades e taxa de utilização"
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Equipamentos */}
          <div>
            <KpiItem
              title="Equipamentos"
              value={formatCurrency(metrics.totalEquipamentos, 0)}
              change={`${metrics.numeroEquipamentos} unidade${metrics.numeroEquipamentos !== 1 ? 's' : ''}`}
              isPositive={true}
              icon={<Wrench className="h-5 w-5 text-white" />}
            />
          </div>

          {/* Tipo de Propriedades */}
          <div className="relative">
            <KpiItem
              title="Propriedades Próprias"
              value={metrics.propriedadesProprias.toString()}
              change={`${metrics.propriedadesArrendadas} arrendada${metrics.propriedadesArrendadas !== 1 ? 's' : ''}`}
              isPositive={true}
              icon={<Building2 className="h-5 w-5 text-white" />}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Investimentos */}
          <div className="relative">
            <KpiItem
              title="Investimentos"
              value={formatCurrency(metrics.totalInvestimentos, 0)}
              change="Realizados"
              isPositive={true}
              icon={<TrendingUp className="h-5 w-5 text-white" />}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Benfeitorias */}
          <div className="relative">
            <KpiItem
              title="Benfeitorias"
              value={formatCurrency(metrics.totalBenfeitorias, 0)}
              change={`${Array.isArray(improvements) ? improvements.length : 0} item${Array.isArray(improvements) && improvements.length !== 1 ? 's' : ''}`}
              isPositive={true}
              icon={<Building2 className="h-5 w-5 text-white" />}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Equipamentos Alienados */}
          <div>
            <KpiItem
              title="Alienados"
              value={`${metrics.equipamentosAlienados}`}
              change={`${metrics.numeroEquipamentos > 0 ? formatPercent((metrics.equipamentosAlienados / metrics.numeroEquipamentos) * 100) : '0%'} dos equipamentos`}
              isPositive={metrics.equipamentosAlienados === 0}
              icon={<Info className="h-5 w-5 text-white" />}
            />
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}