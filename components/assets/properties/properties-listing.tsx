"use client";

import type React from "react";
import { useState, useCallback, useMemo } from "react";
import type { Property, PropertyType } from "@/schemas/properties";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  Search,
  XIcon,
  MapPinIcon,
  EditIcon,
  Trash2Icon,
  AlertTriangleIcon,
  MoreHorizontal,
  EyeIcon,
  Loader2Icon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { PropertyFormModal } from "@/components/properties/property-form-modal";
import { PropertyImportDialog } from "./property-import-dialog";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<PropertyType | "ALL">("ALL");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const router = useRouter();

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1);
    },
    []
  );

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value as PropertyType | "ALL");
    setCurrentPage(1);
  }, []);

  const handleItemsPerPageChange = useCallback((value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  }, []);

  const filteredProperties = useMemo(() => {
    let filtered = properties;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.nome.toLowerCase().includes(search) ||
          property.cidade.toLowerCase().includes(search) ||
          property.proprietario.toLowerCase().includes(search)
      );
    }

    if (typeFilter !== "ALL") {
      filtered = filtered.filter((property) => property.tipo === typeFilter);
    }

    return filtered;
  }, [properties, searchTerm, typeFilter]);

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDelete = async (propertyId: string) => {
    setIsDeleting(true);
    setDeletingPropertyId(propertyId);
    setDeleteError(null);

    try {
      const result = await deleteProperty(propertyId);

      if (result.error) {
        setDeleteError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Propriedade excluída com sucesso!");
        router.refresh();
      }
    } catch (error) {
      const errorMessage = "Erro ao excluir propriedade";
      setDeleteError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeletingPropertyId(null);
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
  };

  const handleImportSuccess = () => {
    setIsImportDialogOpen(false);
    router.refresh();
  };

  const hasActiveFilters = searchTerm !== "" || typeFilter !== "ALL";

  const typeStyles: Record<
    PropertyType,
    { variant: "default" | "secondary" | "outline" | "destructive" }
  > = {
    PROPRIO: { variant: "default" },
    ARRENDADO: { variant: "secondary" },
    PARCERIA: { variant: "outline" },
    COMODATO: { variant: "outline" },
  };

  return (
    <>
      <Card>
        <CardHeaderPrimary
          title="Bens Imóveis"
          icon={<MapPinIcon className="h-5 w-5" />}
          description="Gestão de propriedades rurais"
          action={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(true)}
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar Excel
              </Button>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Nova Propriedade
              </Button>
            </div>
          }
        />

        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cidade ou proprietário..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PROPRIO">Próprio</SelectItem>
                <SelectItem value="ARRENDADO">Arrendado</SelectItem>
                <SelectItem value="PARCERIA">Parceria</SelectItem>
                <SelectItem value="COMODATO">Comodato</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-2"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          {currentProperties.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<MapPinIcon className="h-8 w-8" />}
                title={
                  hasActiveFilters
                    ? "Nenhuma propriedade encontrada"
                    : "Nenhuma propriedade cadastrada"
                }
                description={
                  hasActiveFilters
                    ? "Tente ajustar os filtros para encontrar propriedades."
                    : "Comece cadastrando sua primeira propriedade."
                }
                action={
                  hasActiveFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  ) : (
                    <Button onClick={() => setIsModalOpen(true)}>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Cadastrar Propriedade
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Área Total</TableHead>
                      <TableHead className="text-right">
                        Área Cultivada
                      </TableHead>
                      <TableHead>Proprietário</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
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
                            {property.tipo}
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
                        <TableCell>{property.proprietario}</TableCell>
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
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/properties/${property.id}`}
                                >
                                  <EyeIcon className="mr-2 h-4 w-4" />
                                  Ver detalhes
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(property)}
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
                                      onClick={() => handleDelete(property.id)}
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
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a{" "}
                    {Math.min(endIndex, filteredProperties.length)} de{" "}
                    {filteredProperties.length} propriedades
                  </span>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm px-3">
                      Página {currentPage} de {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PropertyFormModal
        open={isModalOpen || !!editingProperty}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
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

      <PropertyImportDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        organizationId={organizationId}
        onSuccess={handleImportSuccess}
      />
    </>
  );
}
