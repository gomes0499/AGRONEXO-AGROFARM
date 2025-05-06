"use client";

import { Property } from "@/schemas/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatArea } from "@/lib/utils/formatters";
import { 
  MapPinIcon, 
  Building2Icon, 
  AreaChartIcon, 
  EditIcon, 
  Trash2Icon, 
  CalendarIcon,
  FileText,
  Landmark
} from "lucide-react";
import Link from "next/link";
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
import { useState } from "react";
import { deleteProperty } from "@/lib/actions/property-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface PropertyDetailProps {
  property: Property;
}

export function PropertyDetail({ property }: PropertyDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProperty(property.id!);
      router.push("/dashboard/properties");
    } catch (error) {
      console.error("Erro ao excluir propriedade:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{property.nome}</h1>
            <Badge variant={property.tipo === "PROPRIO" ? "default" : "secondary"}>
              {property.tipo === "PROPRIO" ? "Próprio" : "Arrendado"}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPinIcon size={16} />
            {property.cidade}, {property.estado}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/properties">
              Voltar para Lista
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/properties/${property.id}/edit`}>
              <EditIcon size={14} className="mr-1" />
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
                <AlertDialogTitle>Excluir propriedade</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a propriedade &quot;{property.nome}&quot;?
                  Esta ação não pode ser desfeita e removerá todos os dados relacionados.
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
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Proprietário</h3>
              <p className="flex items-center gap-1">
                <Building2Icon size={16} />
                {property.proprietario}
              </p>
            </div>
            
            {property.ano_aquisicao && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Ano de Aquisição</h3>
                <p className="flex items-center gap-1">
                  <CalendarIcon size={16} />
                  {property.ano_aquisicao}
                </p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Matrícula</h3>
              <p className="flex items-center gap-1">
                <FileText size={16} />
                {property.numero_matricula}
              </p>
            </div>
            
            {property.coordenadas && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Coordenadas</h3>
                <p className="flex items-center gap-1">
                  <MapPinIcon size={16} />
                  {property.coordenadas}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Área e Valoração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Área Total</h3>
              <p className="text-2xl font-bold">{formatArea(property.area_total)}</p>
            </div>
            
            {property.area_cultivada && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Área Cultivável</h3>
                <p className="flex items-center gap-1">
                  <AreaChartIcon size={16} />
                  {formatArea(property.area_cultivada)}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({Math.round((property.area_cultivada / property.area_total) * 100)}%)
                  </span>
                </p>
              </div>
            )}
            
            {property.valor_atual && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Valor Atual</h3>
                <p className="flex items-center gap-1">
                  <Landmark size={16} />
                  {formatCurrency(property.valor_atual)}
                </p>
              </div>
            )}
            
            {property.avaliacao_banco && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Avaliação Bancária</h3>
                <p>{formatCurrency(property.avaliacao_banco)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}