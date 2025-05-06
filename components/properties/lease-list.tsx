"use client";

import { Lease } from "@/schemas/properties";
import { formatCurrency, formatDate, formatArea, formatSacas } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { PlusIcon, File, FileText, Edit2Icon, Trash2Icon } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
import { deleteLease } from "@/lib/actions/property-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface LeaseListProps {
  leases: Lease[];
  propertyId: string;
}

export function LeaseList({ leases, propertyId }: LeaseListProps) {
  const [deletingLeaseId, setDeletingLeaseId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (leaseId: string, leasePropertyId: string) => {
    try {
      setDeletingLeaseId(leaseId);
      // Use propertyId se disponível, senão use o ID da propriedade do próprio arrendamento
      const propId = propertyId || leasePropertyId;
      await deleteLease(leaseId, propId);
      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir arrendamento:", error);
    } finally {
      setDeletingLeaseId(null);
    }
  };

  const isActive = (lease: Lease) => {
    const today = new Date();
    return new Date(lease.data_termino) >= today;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contratos de Arrendamento</CardTitle>
        {propertyId ? (
          <Button asChild>
            <Link href={`/dashboard/properties/${propertyId}/leases/new`}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Novo Arrendamento
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {leases.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Fazenda</TableHead>
                <TableHead>Arrendantes</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Área (ha)</TableHead>
                <TableHead>Custo por Hectare</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leases.map((lease) => (
                <TableRow key={lease.id}>
                  <TableCell className="font-medium">{lease.nome_fazenda}</TableCell>
                  <TableCell>{lease.arrendantes}</TableCell>
                  <TableCell>
                    {formatDate(lease.data_inicio)} - {formatDate(lease.data_termino)}
                  </TableCell>
                  <TableCell>{formatArea(lease.area_arrendada)}</TableCell>
                  <TableCell>{formatSacas(lease.custo_hectare)}</TableCell>
                  <TableCell>
                    <Badge variant={isActive(lease) ? "default" : "destructive"}>
                      {isActive(lease) ? "Ativo" : "Vencido"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={propertyId ? 
                          `/dashboard/properties/${propertyId}/leases/${lease.id}` : 
                          `/dashboard/properties/${lease.propriedade_id}/leases/${lease.id}`
                        }>
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Detalhes</span>
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <Link href={propertyId ? 
                          `/dashboard/properties/${propertyId}/leases/${lease.id}/edit` : 
                          `/dashboard/properties/${lease.propriedade_id}/leases/${lease.id}/edit`
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
                            disabled={deletingLeaseId === lease.id}
                          >
                            <Trash2Icon className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir arrendamento</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o arrendamento da fazenda &quot;{lease.nome_fazenda}&quot;?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(lease.id!, lease.propriedade_id)}
                              className={cn("bg-destructive text-destructive-foreground hover:bg-destructive/90", 
                                deletingLeaseId === lease.id && "opacity-50 pointer-events-none")}
                            >
                              {deletingLeaseId === lease.id ? "Excluindo..." : "Excluir"}
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
            title="Nenhum arrendamento cadastrado"
            description="Cadastre contratos de arrendamento para esta propriedade."
            icon={<File size={48} className="text-muted-foreground" />}
            action={propertyId ? (
              <Button asChild>
                <Link href={`/dashboard/properties/${propertyId}/leases/new`}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Novo Arrendamento
                </Link>
              </Button>
            ) : null}
          />
        )}
      </CardContent>
    </Card>
  );
}