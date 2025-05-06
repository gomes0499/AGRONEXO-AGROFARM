"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lease } from "@/schemas/properties";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
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
  FileText
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { deleteLease } from "@/lib/actions/property-actions";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface LeaseDetailProps {
  lease: Lease;
  propertyId: string;
}

export function LeaseDetail({ lease, propertyId }: LeaseDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Obter os anos da projeção de custos
  const custos = typeof lease.custos_projetados_anuais === 'string'
    ? JSON.parse(lease.custos_projetados_anuais)
    : lease.custos_projetados_anuais;
  
  const anos = Object.keys(custos).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/properties/${propertyId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar à Propriedade
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Arrendamento: {lease.nome_fazenda}
          </h1>
          <Badge variant={isActive() ? "default" : "destructive"}>
            {isActive() ? "Ativo" : "Vencido"}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/properties/${propertyId}/leases/${lease.id}/edit`}>
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
                  Tem certeza que deseja excluir este arrendamento?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className={cn("bg-destructive text-destructive-foreground hover:bg-destructive/90", 
                    isDeleting && "opacity-50 pointer-events-none")}
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes do Contrato</CardTitle>
            <CardDescription>
              Informações gerais sobre o contrato de arrendamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Proprietários/Arrendantes</h3>
                <p className="flex items-center gap-1">
                  <Users size={16} />
                  {lease.arrendantes}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Número do Contrato</h3>
                <p className="flex items-center gap-1">
                  <FileText size={16} />
                  {lease.numero_arrendamento}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Data de Início</h3>
                <p className="flex items-center gap-1">
                  <Calendar size={16} />
                  {formatDate(lease.data_inicio)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Data de Término</h3>
                <p className="flex items-center gap-1">
                  <Calendar size={16} />
                  {formatDate(lease.data_termino)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Nome da Fazenda</h3>
                <p className="flex items-center gap-1">
                  <Home size={16} />
                  {lease.nome_fazenda}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Área da Fazenda</h3>
                <p className="flex items-center gap-1">
                  <AreaChart size={16} />
                  {lease.area_fazenda.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ha
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Área Arrendada</h3>
                <p className="flex items-center gap-1">
                  <AreaChart size={16} />
                  {lease.area_arrendada.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ha
                  <span className="text-xs text-muted-foreground ml-1">
                    ({Math.round((lease.area_arrendada / lease.area_fazenda) * 100)}%)
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custos do Arrendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Custo por Hectare</h3>
              <p className="text-xl font-bold flex items-center">
                <DollarSign size={16} className="mr-1" />
                {lease.custo_hectare.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} sacas
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Custo Anual</h3>
              <p className="text-xl font-bold flex items-center">
                <DollarSign size={16} className="mr-1" />
                {lease.custo_ano.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} sacas
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Duração do Contrato</h3>
              <p className="text-xl font-bold">
                {Math.round((new Date(lease.data_termino).getTime() - new Date(lease.data_inicio).getTime()) / (1000 * 60 * 60 * 24 * 365))} anos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projeção de Custos Anuais</CardTitle>
          <CardDescription>
            Estimativa de custos do arrendamento ao longo dos anos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {anos.map((ano) => (
              <div key={ano} className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Ano {ano}</h3>
                <div className="flex items-center">
                  <TrendingUp size={16} className="mr-1" />
                  <p className="text-xl font-bold">{custos[ano].toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} sacas</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}