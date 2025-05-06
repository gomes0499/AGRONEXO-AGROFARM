"use client";

import { Property } from "@/schemas/properties";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatArea } from "@/lib/utils/formatters";
import { 
  MapPinIcon, 
  Building2Icon, 
  AreaChartIcon, 
  ArrowRightIcon, 
  EditIcon, 
  Trash2Icon 
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

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProperty(property.id!);
      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir propriedade:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{property.nome}</CardTitle>
          <Badge variant={property.tipo === "PROPRIO" ? "default" : "secondary"}>
            {property.tipo === "PROPRIO" ? "Próprio" : "Arrendado"}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1">
          <MapPinIcon size={14} />
          {property.cidade}, {property.estado}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Área Total</span>
            <div className="flex items-center gap-1">
              <AreaChartIcon size={14} />
              <span className="font-medium">{formatArea(property.area_total)}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Área Cultivada</span>
            <div className="flex items-center gap-1">
              <AreaChartIcon size={14} />
              <span className="font-medium">
                {formatArea(property.area_cultivada)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Proprietário</span>
          <div className="flex items-center gap-1">
            <Building2Icon size={14} />
            <span className="font-medium">{property.proprietario}</span>
          </div>
        </div>
        
        {property.valor_atual && (
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Valor</span>
            <span className="font-medium">{formatCurrency(property.valor_atual)}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2 pt-2">
        <div className="flex gap-2">
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
        
        <Button size="sm" asChild>
          <Link href={`/dashboard/properties/${property.id}`}>
            Detalhes
            <ArrowRightIcon size={14} className="ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}