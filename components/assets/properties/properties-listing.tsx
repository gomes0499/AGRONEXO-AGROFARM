"use client";

import type React from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
import type { Property, PropertyType } from "@/schemas/properties";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  MapPinIcon,
  EditIcon,
  Trash2Icon,
  AlertTriangleIcon,
  MoreHorizontal,
  EyeIcon,
  Loader2Icon,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { AssetPagination } from "../common/asset-pagination";
import { Badge } from "@/components/ui/badge";
import { PropertyFormModal } from "@/components/properties/property-form-modal";
import { PropertyDetailsModal } from "@/components/properties/property-details-modal";
import { formatCurrency, formatArea } from "@/lib/utils/formatters";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteProperty } from "@/lib/actions/property-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PropertiesListingProps {
  properties: Property[];
  organizationId: string;
}

export function PropertiesListing({
  properties,
  organizationId,
}: PropertiesListingProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [detailsPropertyId, setDetailsPropertyId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const router = useRouter();


  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const totalPages = Math.ceil(properties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = properties.slice(startIndex, endIndex);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDelete = async (propertyId: string) => {
    setIsDeleting(true);
    setDeletingPropertyId(propertyId);
    setDeleteError(null);

    try {
      await deleteProperty(propertyId);
      toast.success("Propriedade excluída com sucesso!");
      router.refresh();
    } catch (error) {
      const errorMessage = "Erro ao excluir propriedade";
      setDeleteError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeletingPropertyId(null);
    }
  };

  const handleEdit = useCallback((property: Property) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  }, []);



  const typeStyles: Record<
    PropertyType,
    { variant: "default" | "secondary" | "outline" | "destructive" }
  > = {
    PROPRIO: { variant: "default" },
    ARRENDADO: { variant: "secondary" },
    PARCERIA_AGRICOLA: { variant: "outline" },
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          title="Bens Imóveis"
          icon={<MapPinIcon className="h-5 w-5" />}
          description="Gestão de propriedades rurais"
          action={
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Nova Propriedade
            </Button>
          }
          className="mb-4"
        />
        <CardContent>
          {currentProperties.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<MapPinIcon className="h-8 w-8" />}
                title="Nenhuma propriedade cadastrada"
                description="Comece cadastrando sua primeira propriedade."
                action={
                  <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Cadastrar Propriedade
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="rounded-t-md overflow-hidden">
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Nome</TableHead>
                      <TableHead className="font-semibold text-primary-foreground">Tipo</TableHead>
                      <TableHead className="font-semibold text-primary-foreground">Localização</TableHead>
                      <TableHead className="text-right font-semibold text-primary-foreground">Área Total</TableHead>
                      <TableHead className="text-right font-semibold text-primary-foreground">
                        Área Cultivada
                      </TableHead>
                      <TableHead className="font-semibold text-primary-foreground">Proprietário</TableHead>
                      <TableHead className="text-right font-semibold text-primary-foreground">Valor</TableHead>
                      <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">
                          {property.nome}
                        </TableCell>
                        <TableCell>
                          <Badge variant={typeStyles[property.tipo].variant}>
                            {property.tipo === "PROPRIO" ? "PRÓPRIO" : 
                             property.tipo === "ARRENDADO" ? "ARRENDADO" :
                             property.tipo === "PARCERIA_AGRICOLA" ? "PARCERIA AGRÍCOLA" : property.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {property.cidade}, {property.estado}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatArea(property.area_total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatArea(property.area_cultivada)}
                        </TableCell>
                        <TableCell>{property.proprietario || "A informar"}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(property.valor_atual)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => {
                                  setDetailsPropertyId(property.id || null);
                                  setIsDetailsModalOpen(true);
                                }}
                              >
                                <EyeIcon className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  handleEdit(property);
                                }}
                              >
                                <EditIcon className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive"
                                  >
                                    <Trash2Icon className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Excluir propriedade
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a
                                      propriedade{" "}
                                      <strong>{property.nome}</strong>? Esta
                                      ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  {deleteError && (
                                    <div className="text-sm text-destructive flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
                                      <AlertTriangleIcon className="h-4 w-4" />
                                      {deleteError}
                                    </div>
                                  )}
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => property.id && handleDelete(property.id)}
                                      disabled={
                                        isDeleting &&
                                        deletingPropertyId === property.id
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {isDeleting &&
                                      deletingPropertyId === property.id ? (
                                        <>
                                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
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

              {/* Paginação */}
              <AssetPagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={properties.length}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      <PropertyFormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingProperty(null);
          }
        }}
        property={editingProperty || undefined}
        organizationId={organizationId}
        mode={editingProperty ? "edit" : "create"}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingProperty(null);
          router.refresh();
        }}
      />

      {detailsPropertyId && (
        <PropertyDetailsModal
          propertyId={detailsPropertyId}
          open={isDetailsModalOpen}
          onOpenChange={(open) => {
            setIsDetailsModalOpen(open);
            if (!open) {
              setDetailsPropertyId(null);
            }
          }}
        />
      )}

    </div>
  );
}
