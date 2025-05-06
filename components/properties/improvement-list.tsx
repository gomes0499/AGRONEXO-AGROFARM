"use client";

import { Improvement } from "@/schemas/properties";
import { formatCurrency } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { PlusIcon, Building, HomeIcon, Edit2Icon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
import { deleteImprovement } from "@/lib/actions/property-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ImprovementListProps {
  improvements: Improvement[];
  propertyId: string;
}

export function ImprovementList({ improvements, propertyId }: ImprovementListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string, improvementPropertyId: string) => {
    try {
      setDeletingId(id);
      // Use propertyId se disponível, senão use o ID da propriedade da própria benfeitoria
      const propId = propertyId || improvementPropertyId;
      await deleteImprovement(id, propId);
      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir benfeitoria:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const totalValue = improvements.reduce((sum, imp) => sum + (imp.valor || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Benfeitorias</CardTitle>
          {improvements.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Valor total: {formatCurrency(totalValue)}
            </p>
          )}
        </div>
        {propertyId ? (
          <Button asChild>
            <Link href={`/dashboard/properties/${propertyId}/improvements/new`}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Nova Benfeitoria
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {improvements.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Dimensões</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {improvements.map((improvement) => (
                <TableRow key={improvement.id}>
                  <TableCell className="font-medium">{improvement.descricao}</TableCell>
                  <TableCell>{improvement.dimensoes || "-"}</TableCell>
                  <TableCell>{formatCurrency(improvement.valor)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={propertyId ? 
                          `/dashboard/properties/${propertyId}/improvements/${improvement.id}/edit` : 
                          `/dashboard/properties/${improvement.propriedade_id}/improvements/${improvement.id}/edit`
                        }>
                          <Edit2Icon className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingId === improvement.id}
                          >
                            <Trash2Icon className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir benfeitoria</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a benfeitoria &quot;{improvement.descricao}&quot;?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(improvement.id!, improvement.propriedade_id)}
                              className={cn("bg-destructive text-destructive-foreground hover:bg-destructive/90", 
                                deletingId === improvement.id && "opacity-50 pointer-events-none")}
                            >
                              {deletingId === improvement.id ? "Excluindo..." : "Excluir"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="Nenhuma benfeitoria cadastrada"
            description="Cadastre benfeitorias e melhorias realizadas nesta propriedade."
            icon={<Building size={48} className="text-muted-foreground" />}
            action={propertyId ? (
              <Button asChild>
                <Link href={`/dashboard/properties/${propertyId}/improvements/new`}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Nova Benfeitoria
                </Link>
              </Button>
            ) : null}
          />
        )}
      </CardContent>
    </Card>
  );
}