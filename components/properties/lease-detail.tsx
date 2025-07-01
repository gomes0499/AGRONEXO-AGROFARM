"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Lease } from "@/schemas/properties";
import {
  formatDate,
  formatCurrency,
  formatSacas,
} from "@/lib/utils/formatters";
import { getSafrasByIds } from "@/lib/actions/property-actions";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit2Icon,
  Trash2Icon,
  Calendar,
  Home,
  Users,
  AreaChart,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  Percent,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteLease } from "@/lib/actions/property-actions";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface LeaseDetailProps {
  lease: Lease;
  propertyId: string;
  organizationId?: string;
}

export function LeaseDetail({ lease, propertyId, organizationId }: LeaseDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [safrasMap, setSafrasMap] = useState<{[key: string]: any}>({});
  const [loadingSafras, setLoadingSafras] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteLease(lease.id!, propertyId);
      router.push(`/dashboard/properties/${propertyId}`);
    } catch (error) {
      console.error("Erro ao excluir arrendamento:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isActive = () => {
    const today = new Date();
    return new Date(lease.data_termino) >= today;
  };

  // Calcular o tempo restante do contrato
  const calculateRemainingTime = () => {
    const today = new Date();
    const endDate = new Date(lease.data_termino);
    const totalDays = Math.round(
      (endDate.getTime() - new Date(lease.data_inicio).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const remainingDays = Math.max(
      0,
      Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      totalDays,
      remainingDays,
      percentComplete: Math.min(
        100,
        Math.round(((totalDays - remainingDays) / totalDays) * 100)
      ),
      years: Math.round(totalDays / 365),
      remainingYears: (remainingDays / 365).toFixed(1),
    };
  };

  const contractTime = calculateRemainingTime();

  // Obter os anos da projeção de custos
  const custos =
    typeof lease.custos_por_ano === "string"
      ? JSON.parse(lease.custos_por_ano)
      : lease.custos_por_ano;

  // Buscar informações das safras
  useEffect(() => {
    const fetchSafras = async () => {
      if (!organizationId || !custos || Object.keys(custos).length === 0) {
        return;
      }

      try {
        setLoadingSafras(true);
        const safraIds = Object.keys(custos);
        const safrasData = await getSafrasByIds(organizationId, safraIds);
        
        // Criar um mapa de ID -> dados da safra
        const safrasMap: {[key: string]: any} = {};
        safrasData.forEach((safra: any) => {
          safrasMap[safra.id] = safra;
        });
        
        setSafrasMap(safrasMap);
      } catch (error) {
        console.error("Erro ao buscar safras:", error);
      } finally {
        setLoadingSafras(false);
      }
    };

    fetchSafras();
  }, [organizationId, custos]);

  // Ordenar as safras cronologicamente quando os dados estiverem disponíveis
  const anos = Object.keys(custos).sort((a, b) => {
    const safraA = safrasMap[a];
    const safraB = safrasMap[b];
    
    if (safraA && safraB) {
      // Ordenar por ano de início das safras
      return safraA.ano_inicio - safraB.ano_inicio;
    }
    
    // Fallback para ordenação por UUID se não tiver dados da safra
    return a.localeCompare(b);
  });
  
  console.log("Custos do arrendamento:", custos);
  console.log("Safras encontradas:", safrasMap);
  console.log("Anos ordenados:", anos);

  // Preparar dados para o gráfico - convertendo de sacas para R$
  const chartData = anos.map((safraId) => {
    const safra = safrasMap[safraId];
    const displayName = safra 
      ? `${safra.ano_inicio}/${safra.ano_fim}` // Mostrar apenas os anos para ficar mais limpo
      : safraId.substring(0, 8);
    
    return {
      ano: displayName,
      valor: custos[safraId],
      safraId: safraId // Manter ID original para referência
    };
  });

  // Configuração do gráfico
  const chartConfig = {
    valor: {
      label: "Sacas",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  // Calcular a variação percentual em relação ao primeiro ano
  const firstYearValue = custos[anos[0]] || 0;
  const lastYearValue = custos[anos[anos.length - 1]] || 0;
  const percentChange = firstYearValue
    ? ((lastYearValue - firstYearValue) / firstYearValue) * 100
    : 0;
  const isIncreasing = percentChange > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {lease.nome_fazenda}
            </h1>
            <Badge variant={isActive() ? "default" : "destructive"}>
              {isActive() ? "Ativo" : "Vencido"}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/dashboard/properties/${propertyId}/leases/${lease.id}/edit`}
            >
              <Edit2Icon size={14} className="mr-1" />
              Editar
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2Icon size={14} className="mr-1" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir arrendamento</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este arrendamento? Esta ação
                  não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className={cn(
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    isDeleting && "opacity-50 pointer-events-none"
                  )}
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card de Detalhes por Ano - Agora visível sempre e no topo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>Detalhes por Ano</span>
              <Badge
                variant={isActive() ? "outline" : "destructive"}
                className="ml-2"
              >
                {isActive()
                  ? `Restam ${contractTime.remainingYears} anos`
                  : "Contrato Vencido"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {loadingSafras ? (
                <div className="col-span-5 text-center py-4">
                  <div className="text-sm text-muted-foreground">Carregando informações das safras...</div>
                </div>
              ) : Object.keys(custos).length === 0 ? (
                <div className="col-span-5 text-center py-4">
                  <div className="text-sm text-muted-foreground">Nenhuma projeção de custo cadastrada para este arrendamento.</div>
                </div>
              ) : anos.length === 0 ? (
                <div className="col-span-5 text-center py-4">
                  <div className="text-sm text-muted-foreground">Não foi possível encontrar as safras para os custos cadastrados.</div>
                </div>
              ) : (
                anos.map((safraId) => {
                  const safra = safrasMap[safraId];
                  const displayName = safra 
                    ? `${safra.nome} (${safra.ano_inicio}/${safra.ano_fim})`
                    : safraId.substring(0, 8) + "...";
                  
                  return (
                    <div key={safraId} className="border p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-1 line-clamp-2" title={displayName}>
                        {displayName}
                      </h3>
                      <div className="flex items-center">
                        <DollarSign
                          size={16}
                          className="mr-1 text-muted-foreground"
                        />
                        <p className="text-xl font-bold">
                          {formatCurrency(custos[safraId])}
                        </p>
                      </div>
                      {safraId === anos[0] ? (
                        <Badge className="mt-2" variant="outline">
                          Safra Base
                        </Badge>
                      ) : (
                        <div className="flex items-center mt-2 text-xs">
                          <Percent size={12} className="mr-1" />
                          <span
                            className={
                              custos[safraId] > custos[anos[0]]
                                ? "text-red-500"
                                : "text-green-500"
                            }
                          >
                            {custos[safraId] !== custos[anos[0]]
                              ? `${custos[safraId] > custos[anos[0]] ? "+" : ""}${(
                                  ((custos[safraId] - custos[anos[0]]) /
                                    custos[anos[0]]) *
                                  100
                                ).toFixed(1)}%`
                              : "0%"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Detalhes do Arrendamento - Agora abaixo do card de Detalhes por Ano */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>Detalhes do Arrendamento</span>
              <Badge
                variant={isActive() ? "outline" : "destructive"}
                className="ml-2"
              >
                {isActive()
                  ? `Restam ${contractTime.remainingYears} anos`
                  : "Contrato Vencido"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Progresso do Contrato
                    </span>
                    <span className="font-medium">
                      {contractTime.percentComplete}%
                    </span>
                  </div>
                  <Progress
                    value={contractTime.percentComplete}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatDate(lease.data_inicio)}</span>
                    <span>{formatDate(lease.data_termino)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      Área Arrendada
                    </div>
                    <div className="text-lg font-semibold flex items-center">
                      <AreaChart
                        size={16}
                        className="mr-1 text-muted-foreground"
                      />
                      {lease.area_arrendada.toLocaleString("pt-BR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      ha
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                      Custo Anual
                    </div>
                    <div className="text-lg font-semibold flex items-center">
                      <AreaChart
                        size={16}
                        className="mr-1 text-muted-foreground"
                      />
                      {formatSacas(lease.area_arrendada * (lease.custo_hectare || 0))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Proprietários/Arrendantes
                  </h3>
                  <p className="flex items-center gap-1 font-medium">
                    <Users size={16} className="text-muted-foreground" />
                    {lease.arrendantes}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Número do Contrato
                  </h3>
                  <p className="flex items-center gap-1 font-medium">
                    <FileText size={16} className="text-muted-foreground" />
                    {lease.numero_arrendamento}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Duração do Contrato
                  </h3>
                  <p className="flex items-center gap-1 font-medium">
                    <Clock size={16} className="text-muted-foreground" />
                    {contractTime.years} anos
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Safra Base
                  </h3>
                  {(lease as any).safra ? (
                    <div>
                      <p className="font-medium">{(lease as any).safra.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {(lease as any).safra.ano_inicio}/{(lease as any).safra.ano_fim}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Não informado</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Tipo de Pagamento
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {lease.tipo_pagamento || "SACAS"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Status do Contrato
                  </h3>
                  <div className="flex gap-1">
                    <Badge variant={isActive() ? "default" : "destructive"}>
                      {isActive() ? "Ativo" : "Vencido"}
                    </Badge>
                    {lease.ativo !== undefined && !lease.ativo && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                </div>
              </div>

              {lease.observacoes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Observações
                    </h3>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">
                      {lease.observacoes}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Nome da Fazenda
                  </h3>
                  <p className="flex items-center gap-1 font-medium">
                    <Home size={16} className="text-muted-foreground" />
                    {lease.nome_fazenda}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Área da Fazenda
                  </h3>
                  <p className="flex items-center gap-1 font-medium">
                    <AreaChart size={16} className="text-muted-foreground" />
                    {lease.area_fazenda.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    ha
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Área Arrendada
                  </h3>
                  <p className="flex items-center gap-1 font-medium">
                    <AreaChart size={16} className="text-muted-foreground" />
                    {lease.area_arrendada.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    ha
                    <Badge variant="outline" className="ml-1 font-normal">
                      {Math.round(
                        (lease.area_arrendada / lease.area_fazenda) * 100
                      )}
                      %
                    </Badge>
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Custo por Hectare
                  </h3>
                  <p className="text-xl font-bold flex items-center">
                    <AreaChart size={16} className="text-muted-foreground" />
                    {formatSacas(lease.custo_hectare)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Custo Anual
                  </h3>
                  <p className="text-xl font-bold flex items-center">
                    <AreaChart size={16} className="text-muted-foreground" />
                    {formatSacas(lease.area_arrendada * (lease.custo_hectare || 0))}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Data do Contrato
                  </h3>
                  <p className="flex items-center gap-1 font-medium">
                    <Calendar size={16} className="text-muted-foreground" />
                    {formatDate(lease.data_inicio)} -{" "}
                    {formatDate(lease.data_termino)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
