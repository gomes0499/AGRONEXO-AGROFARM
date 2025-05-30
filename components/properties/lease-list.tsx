"use client";

import { Lease } from "@/schemas/properties";
import {
  formatCurrency,
  formatDate,
  formatArea,
  formatSacas,
} from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { PlusIcon, File, FileText, Edit2Icon, Trash2Icon, MoreHorizontal, ScrollText } from "lucide-react";
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
import { useState } from "react";
import { deleteLease } from "@/lib/actions/property-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { LeaseFormDrawer } from "./lease-form-drawer";

interface LeaseListProps {
  leases: Lease[];
  propertyId: string;
  organizationId: string;
}

export function LeaseList({ leases, propertyId, organizationId }: LeaseListProps) {
  const [deletingLeaseId, setDeletingLeaseId] = useState<string | null>(null);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
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
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        title="Contratos de Arrendamento"
        icon={<ScrollText className="h-5 w-5" />}
        description="Gestão de contratos de aluguel e uso da terra"
        action={
          propertyId ? (
            <Button onClick={() => setShowCreateDrawer(true)} className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200">
              <PlusIcon className="mr-2 h-4 w-4" />
              Novo Arrendamento
            </Button>
          ) : undefined
        }
        className="mb-4"
      />
      <CardContent>
        {leases.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Nome da Fazenda</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Safra</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Arrendantes</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Período</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Área (ha)</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Tipo Pagamento</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leases.map((lease) => (
                  <TableRow key={lease.id}>
                    <TableCell className="font-medium">
                      {lease.nome_fazenda}
                    </TableCell>
                    <TableCell>
                      {lease.safra ? (
                        <div className="text-sm">
                          <div className="font-medium">{lease.safra.nome}</div>
                          <div className="text-muted-foreground">
                            {lease.safra.ano_inicio}/{lease.safra.ano_fim}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{lease.arrendantes}</TableCell>
                    <TableCell>
                      {formatDate(lease.data_inicio)} -{" "}
                      {formatDate(lease.data_termino)}
                    </TableCell>
                    <TableCell>{formatArea(lease.area_arrendada)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {lease.tipo_pagamento || "SACAS"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge
                          variant={isActive(lease) ? "default" : "destructive"}
                        >
                          {isActive(lease) ? "Ativo" : "Vencido"}
                        </Badge>
                        {lease.ativo !== undefined && !lease.ativo && (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            disabled={deletingLeaseId === lease.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={
                                propertyId
                                  ? `/dashboard/properties/${propertyId}/leases/${lease.id}`
                                  : `/dashboard/properties/${lease.propriedade_id}/leases/${lease.id}`
                              }
                              className="flex items-center gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              Detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingLease(lease)}>
                            <Edit2Icon className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2Icon className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Excluir arrendamento
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o arrendamento da
                                  fazenda &quot;{lease.nome_fazenda}&quot;? Esta
                                  ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDelete(lease.id!, lease.propriedade_id)
                                  }
                                  className={cn(
                                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                                    deletingLeaseId === lease.id &&
                                      "opacity-50 pointer-events-none"
                                  )}
                                >
                                  {deletingLeaseId === lease.id
                                    ? "Excluindo..."
                                    : "Excluir"}
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
        ) : (
          <EmptyState
            title="Nenhum arrendamento cadastrado"
            description="Cadastre contratos de arrendamento para esta propriedade."
            icon={<File size={48} className="text-muted-foreground" />}
            action={
              propertyId ? (
                <Button onClick={() => setShowCreateDrawer(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Novo Arrendamento
                </Button>
              ) : null
            }
          />
        )}
      </CardContent>

      {/* Create Lease Drawer */}
      <LeaseFormDrawer
        open={showCreateDrawer}
        onOpenChange={setShowCreateDrawer}
        organizationId={organizationId}
        propertyId={propertyId}
        onSuccess={() => {
          setShowCreateDrawer(false);
          router.refresh();
        }}
      />

      {/* Edit Lease Drawer */}
      {editingLease && (
        <LeaseFormDrawer
          open={!!editingLease}
          onOpenChange={(open) => !open && setEditingLease(null)}
          organizationId={organizationId}
          propertyId={propertyId}
          lease={editingLease}
          onSuccess={() => {
            setEditingLease(null);
            router.refresh();
          }}
        />
      )}
    </Card>
  );
}
