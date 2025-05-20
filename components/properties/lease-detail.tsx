"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lease } from "@/schemas/properties";
import {
  formatDate,
  formatCurrency,
  formatSacas,
} from "@/lib/utils/formatters";
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
}

export function LeaseDetail({ lease, propertyId }: LeaseDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  // Não há mais tabs nesta versão do componente
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
    typeof lease.custos_projetados_anuais === "string"
      ? JSON.parse(lease.custos_projetados_anuais)
      : lease.custos_projetados_anuais;

  const anos = Object.keys(custos).sort();

  // Preparar dados para o gráfico - convertendo de sacas para R$
  const chartData = anos.map((ano) => ({
    ano,
    valor: custos[ano], // usando valor em sacas (formatação será feita na exibição)
  }));

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
              {anos.map((ano) => (
                <div key={ano} className="border p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-1">Ano {ano}</h3>
                  <div className="flex items-center">
                    <DollarSign
                      size={16}
                      className="mr-1 text-muted-foreground"
                    />
                    <p className="text-xl font-bold">
                      {formatCurrency(custos[ano])}
                    </p>
                  </div>
                  {ano === anos[0] ? (
                    <Badge className="mt-2" variant="outline">
                      Ano Base
                    </Badge>
                  ) : (
                    <div className="flex items-center mt-2 text-xs">
                      <Percent size={12} className="mr-1" />
                      <span
                        className={
                          custos[ano] > custos[anos[0]]
                            ? "text-red-500"
                            : "text-green-500"
                        }
                      >
                        {custos[ano] !== custos[anos[0]]
                          ? `${custos[ano] > custos[anos[0]] ? "+" : ""}${(
                              ((custos[ano] - custos[anos[0]]) /
                                custos[anos[0]]) *
                              100
                            ).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
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
                      {formatSacas(lease.custo_ano)}
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
                    {formatSacas(lease.custo_ano)}
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
