"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Property } from "@/schemas/properties";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatArea } from "@/lib/utils/formatters";
import {
  MapPinIcon,
  Building2Icon,
  AreaChartIcon,
  ArrowRightIcon,
  EditIcon,
  Trash2Icon,
  AlertTriangleIcon,
} from "lucide-react";
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
import { deleteProperty } from "@/lib/actions/property-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PropertyCardProps {
  property: Property;
  onDelete?: () => void;
}

export function PropertyCard({ property, onDelete }: PropertyCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  // Memoize the delete handler to prevent unnecessary re-renders
  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteProperty(property.id!);

      toast.success(
        `A propriedade "${property.nome}" foi excluída com sucesso.`
      );

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Erro ao excluir propriedade:", error);
      setDeleteError(
        "Não foi possível excluir a propriedade. Tente novamente mais tarde."
      );

      toast.error("Ocorreu um erro ao excluir a propriedade. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  }, [property.id, property.nome, router, toast, onDelete]);

  // Determine property type label and badge variant
  const propertyTypeInfo = {
    PROPRIO: { label: "Próprio", variant: "default" as const },
    ARRENDADO: { label: "Arrendado", variant: "secondary" as const },
  };

  const typeInfo = propertyTypeInfo[property.tipo] || propertyTypeInfo.PROPRIO;

  return (
    <Card className="w-full h-full overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl truncate" title={property.nome}>
            {property.nome}
          </CardTitle>
          <Badge variant={typeInfo.variant} className="shrink-0">
            {typeInfo.label}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 truncate">
          <MapPinIcon size={14} className="shrink-0" aria-hidden="true" />
          <span title={`${property.cidade}, ${property.estado}`}>
            {property.cidade}, {property.estado}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Área Total</span>
            <div className="flex items-center gap-1">
              <AreaChartIcon
                size={14}
                className="shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="font-medium">
                {formatArea(property.area_total)}
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              Área Cultivada
            </span>
            <div className="flex items-center gap-1">
              <AreaChartIcon
                size={14}
                className="shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="font-medium">
                {formatArea(property.area_cultivada)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Proprietário</span>
          <div className="flex items-center gap-1">
            <Building2Icon
              size={14}
              className="shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span
              className="font-medium truncate"
              title={property.proprietario}
            >
              {property.proprietario}
            </span>
          </div>
        </div>

        {property.valor_atual && (
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Valor</span>
            <span className="font-medium">
              {formatCurrency(property.valor_atual)}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap sm:flex-nowrap justify-between gap-2 pt-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="h-8">
            <Link
              href={`/dashboard/properties/${property.id}/edit`}
              aria-label={`Editar propriedade ${property.nome}`}
            >
              <EditIcon
                size={14}
                className="mr-1 shrink-0"
                aria-hidden="true"
              />
              Editar
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                className="h-8"
                aria-label={`Excluir propriedade ${property.nome}`}
              >
                <Trash2Icon
                  size={14}
                  className="mr-1 shrink-0"
                  aria-hidden="true"
                />
                {isDeleting ? "Excluindo..." : "Excluir"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir propriedade</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a propriedade &quot;
                  {property.nome}&quot;? Esta ação não pode ser desfeita e
                  removerá todos os dados relacionados.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {deleteError && (
                <div className="flex items-center gap-2 p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                  <AlertTriangleIcon size={16} className="shrink-0" />
                  <p>{deleteError}</p>
                </div>
              )}

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

        <Button size="sm" asChild className="w-full sm:w-auto h-8">
          <Link
            href={`/dashboard/properties/${property.id}`}
            aria-label={`Ver detalhes da propriedade ${property.nome}`}
          >
            Detalhes
            <ArrowRightIcon
              size={14}
              className="ml-1 shrink-0"
              aria-hidden="true"
            />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
