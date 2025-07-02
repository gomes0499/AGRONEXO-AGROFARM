"use client";

import { useState, useTransition, useCallback } from "react";
import { Lease } from "@/schemas/properties";
import {
  formatCurrency,
  formatDate,
  formatArea,
  formatSacas,
} from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  File,
  FileText,
  Edit2Icon,
  Trash2Icon,
  MoreHorizontal,
  ScrollText,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteLease, getLeases } from "@/lib/actions/property-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { LeaseFormModal } from "./lease-form-modal";
import { toast } from "sonner";

interface LeaseListProps {
  organizationId: string;
  propertyId?: string;
  initialLeases: Lease[];
  error?: string;
}

export function LeaseList({
  organizationId,
  propertyId,
  initialLeases,
  error: initialError,
}: LeaseListProps) {
  const [leases, setLeases] = useState<Lease[]>(initialLeases);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isPending, startTransition] = useTransition();
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingLeaseId, setDeletingLeaseId] = useState<string | null>(null);

  const router = useRouter();

  // Refresh data when needed
  const refreshData = useCallback(() => {
    startTransition(async () => {
      try {
        const newLeases = await getLeases(organizationId, propertyId);
        setLeases(newLeases);
        setError(null);
      } catch (err) {
        console.error("❌ Erro ao atualizar arrendamentos:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao carregar dados";
        setError(`Erro ao buscar arrendamentos: ${errorMessage}`);
      }
    });
  }, [organizationId, propertyId]);

  const handleDeleteLease = useCallback(
    async (leaseId: string, leaseName: string) => {
      try {
        setIsDeleting(true);
        setDeletingLeaseId(leaseId);

        await deleteLease(leaseId, organizationId);

        toast.success(`Arrendamento "${leaseName}" excluído com sucesso!`);
        refreshData();
      } catch (error) {
        console.error("Erro ao excluir arrendamento:", error);
        toast.error("Erro ao excluir arrendamento. Tente novamente.");
      } finally {
        setIsDeleting(false);
        setDeletingLeaseId(null);
      }
    },
    [refreshData]
  );

  const handleEditLease = (lease: Lease) => {
    setEditingLease(lease);
    setIsLeaseModalOpen(true);
  };

  const handleLeaseSave = useCallback(() => {
    setIsLeaseModalOpen(false);
    setEditingLease(null);
    refreshData();
  }, [refreshData]);

  const handleModalClose = useCallback(() => {
    setIsLeaseModalOpen(false);
    setEditingLease(null);
  }, []);

  const getStatusBadge = (lease: Lease) => {
    const now = new Date();
    const startDate = new Date(lease.data_inicio);
    const endDate = new Date(lease.data_termino);

    if (now < startDate) {
      return <Badge variant="outline">Futuro</Badge>;
    } else if (now > endDate) {
      return <Badge variant="secondary">Finalizado</Badge>;
    } else {
      return <Badge variant="default">Ativo</Badge>;
    }
  };

  if (error) {
    return (
      <EmptyState
        icon={<FileText className="h-10 w-10 text-destructive" />}
        title="Erro ao carregar arrendamentos"
        description={error}
        action={
          <Button onClick={refreshData} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Tentar novamente
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 relative">
      {isPending && (
        <div className="absolute top-2 right-2 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}

      <Card>
        <CardHeaderPrimary
          icon={<ScrollText className="h-4 w-4" />}
          title="Arrendamentos"
          description="Gerencie os contratos de arrendamento"
          action={
            <Button
              onClick={() => setIsLeaseModalOpen(true)}
              className="bg-white text-black hover:bg-white/90"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Novo Arrendamento
            </Button>
          }
        />
        <CardContent>
          {leases.length === 0 ? (
            <EmptyState
              icon={<ScrollText className="h-10 w-10 text-muted-foreground" />}
              title="Nenhum arrendamento cadastrado"
              description="Comece adicionando o primeiro contrato de arrendamento."
              action={
                <Button onClick={() => setIsLeaseModalOpen(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Adicionar Arrendamento
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Nome da Fazenda</TableHead>
                    <TableHead>Arrendantes</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Área Fazenda</TableHead>
                    <TableHead className="text-right">Área Arrendada</TableHead>
                    <TableHead className="text-right">Custo/ha</TableHead>
                    <TableHead className="text-right">Custo Anual</TableHead>
                    <TableHead className="w-[50px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leases.map((lease) => (
                    <TableRow key={lease.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {lease.numero_arrendamento}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lease.nome_fazenda}</p>
                          {(lease as any).safra && (
                            <p className="text-xs text-muted-foreground">
                              Safra: {(lease as any).safra.nome}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{lease.arrendantes}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(lease.data_inicio)}</div>
                          <div className="text-muted-foreground">
                            até {formatDate(lease.data_termino)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(lease)}</TableCell>
                      <TableCell className="text-right">
                        {formatArea(lease.area_fazenda)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatArea(lease.area_arrendada)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatSacas(lease.custo_hectare)} sacas/ha
                      </TableCell>
                      <TableCell className="text-right">
                        {formatSacas((lease as any).custo_ano)} sacas/ano
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditLease(lease)}
                            >
                              <Edit2Icon className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2Icon className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Confirmar exclusão
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o
                                    arrendamento "{lease.numero_arrendamento}"
                                    da fazenda "{lease.nome_fazenda}"? Esta ação
                                    não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteLease(
                                        lease.id || "",
                                        `${lease.numero_arrendamento} - ${lease.nome_fazenda}`
                                      )
                                    }
                                    disabled={
                                      isDeleting && deletingLeaseId === lease.id
                                    }
                                  >
                                    {isDeleting &&
                                    deletingLeaseId === lease.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Excluindo...
                                      </>
                                    ) : (
                                      "Excluir"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de arrendamento */}
      <LeaseFormModal
        open={isLeaseModalOpen}
        onOpenChange={handleModalClose}
        onSuccess={handleLeaseSave}
        organizationId={organizationId}
        propertyId={propertyId || ""}
        lease={editingLease || undefined}
      />
    </div>
  );
}
