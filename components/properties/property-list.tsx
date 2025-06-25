"use client";

import type React from "react";

import { useState, useCallback, useMemo, useEffect } from "react";
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
import { PropertyFormModal } from "./property-form-modal";
import { PropertyImportDialog } from "../assets/properties/property-import-dialog";
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

interface PropertyListProps {
  properties: Property[];
  organizationId: string;
}

export function PropertyList({
  properties,
  organizationId,
}: PropertyListProps) {
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

  // Log para debug
  useEffect(() => {
    console.log("PropertyList recebeu:", {
      propertiesCount: properties?.length || 0,
      organizationId,
      firstProperty: properties?.[0] || null,
    });
  }, [properties, organizationId]);

  // Usando useCallback para funções que não mudam frequentemente
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

  const handleTypeChange = useCallback((value: string) => {
    setTypeFilter(value as PropertyType | "ALL");
    setCurrentPage(1);
  }, []);

  const handleDelete = useCallback(
    async (propertyId: string, propertyName: string) => {
      try {
        setIsDeleting(true);
        setDeletingPropertyId(propertyId);
        setDeleteError(null);
        await deleteProperty(propertyId);

        toast.success(
          `A propriedade "${propertyName}" foi excluída com sucesso.`
        );

        router.refresh();
      } catch (error) {
        console.error("Erro ao excluir propriedade:", error);
        setDeleteError(
          "Não foi possível excluir a propriedade. Tente novamente mais tarde."
        );

        toast.error(
          "Ocorreu um erro ao excluir a propriedade. Tente novamente."
        );
      } finally {
        setIsDeleting(false);
        setDeletingPropertyId(null);
      }
    },
    [router]
  );

  // Usando useMemo para evitar recálculos desnecessários em cada renderização
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch =
        property.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.cidade &&
          property.cidade.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (property.proprietario &&
          property.proprietario
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === "ALL" || property.tipo === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [properties, searchTerm, typeFilter]);

  // Paginação
  const totalItems = filteredProperties.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  }, []);

  const handleImportSuccess = useCallback(
    (importedProperties: any[]) => {
      setIsImportDialogOpen(false);
      router.refresh();
      toast.success(
        `${importedProperties.length} propriedades importadas com sucesso!`
      );
    },
    [router]
  );

  const isFiltering = searchTerm || typeFilter !== "ALL";

  // Determine property type label and badge variant
  const propertyTypeInfo = {
    PROPRIO: { label: "Próprio", variant: "default" as const },
    ARRENDADO: { label: "Arrendado", variant: "secondary" as const },
    PARCERIA: { label: "Parceria", variant: "outline" as const },
    PARCERIA_AGRICOLA: { label: "Parceria Agrícola", variant: "outline" as const },
    COMODATO: { label: "Comodato", variant: "ghost" as const },
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Bens Imóveis</h2>
            <p className="text-primary-foreground/80 text-sm">
              Gerencie suas propriedades rurais, arrendamentos e benfeitorias
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
              className="bg-white hover:bg-gray-100 text-gray-900 border-gray-200"
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar Excel
            </Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Nova Propriedade
            </Button>

            <PropertyFormModal
              organizationId={organizationId}
              mode="create"
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
              onSuccess={() => {
                setIsModalOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, cidade ou proprietário..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Buscar propriedades"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 w-7 p-0"
                onClick={() => setSearchTerm("")}
                aria-label="Limpar busca"
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Limpar busca</span>
              </Button>
            )}
          </div>
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os tipos</SelectItem>
              <SelectItem value="PROPRIO">Próprias</SelectItem>
              <SelectItem value="ARRENDADO">Arrendadas</SelectItem>
              <SelectItem value="PARCERIA">Parceria</SelectItem>
              <SelectItem value="COMODATO">Comodato</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {isFiltering
              ? `${filteredProperties.length} ${
                  filteredProperties.length === 1
                    ? "propriedade encontrada"
                    : "propriedades encontradas"
                }`
              : `Total: ${totalItems} ${
                  totalItems === 1 ? "propriedade" : "propriedades"
                }`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {isFiltering && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Itens por página:
              </span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-20">
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
          </div>
        </div>

        {filteredProperties.length > 0 ? (
          <>
            <div className="rounded-md border overflow-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">
                      Nome
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Tipo
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Localização
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Área Total
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Área Cultivada
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Proprietário
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Valor
                    </TableHead>
                    <TableHead className="text-right font-semibold text-primary-foreground rounded-tr-md">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProperties.map((property) => {
                    const typeInfo =
                      propertyTypeInfo[property.tipo] ||
                      propertyTypeInfo.PROPRIO;

                    return (
                      <TableRow key={property.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">
                          {property.nome}
                        </TableCell>
                        <TableCell>
                          <Badge variant={typeInfo.variant}>
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPinIcon
                              size={14}
                              className="shrink-0 text-muted-foreground"
                            />
                            <span>
                              {property.cidade}, {property.estado}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatArea(property.area_total)}</TableCell>
                        <TableCell>
                          {formatArea(property.area_cultivada)}
                        </TableCell>
                        <TableCell>{property.proprietario}</TableCell>
                        <TableCell>
                          {property.valor_atual ? (
                            <Badge
                              variant="default"
                              className="bg-accent text-accent-foreground"
                            >
                              {formatCurrency(property.valor_atual)}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Não informado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreHorizontal size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/dashboard/properties/${property.id}`}
                                    className="flex cursor-pointer items-center"
                                  >
                                    <EyeIcon size={14} className="mr-2" />
                                    Gerenciar
                                  </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => setEditingProperty(property)}
                                >
                                  <EditIcon size={14} className="mr-2" />
                                  Editar
                                </DropdownMenuItem>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      disabled={
                                        isDeleting &&
                                        deletingPropertyId === property.id
                                      }
                                      className="text-destructive focus:text-destructive cursor-pointer"
                                    >
                                      {isDeleting &&
                                      deletingPropertyId === property.id ? (
                                        <Loader2Icon
                                          size={14}
                                          className="mr-2 animate-spin"
                                        />
                                      ) : (
                                        <Trash2Icon
                                          size={14}
                                          className="mr-2"
                                        />
                                      )}
                                      {isDeleting &&
                                      deletingPropertyId === property.id
                                        ? "Excluindo..."
                                        : "Excluir"}
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="dark:bg-background">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Excluir propriedade
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir a
                                        propriedade &quot;
                                        {property.nome}&quot;? Esta ação não
                                        pode ser desfeita e removerá todos os
                                        dados relacionados.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    {deleteError && (
                                      <div className="flex items-center gap-2 p-3 text-sm bg-destructive/10 dark:bg-destructive/20 text-destructive dark:text-destructive-foreground rounded-md">
                                        <AlertTriangleIcon
                                          size={16}
                                          className="shrink-0"
                                        />
                                        <p>{deleteError}</p>
                                      </div>
                                    )}

                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDelete(
                                            property.id!,
                                            property.nome
                                          )
                                        }
                                        className={cn(
                                          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                                          isDeleting &&
                                            deletingPropertyId ===
                                              property.id &&
                                            "opacity-50 pointer-events-none"
                                        )}
                                      >
                                        {isDeleting &&
                                        deletingPropertyId === property.id
                                          ? "Excluindo..."
                                          : "Excluir"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)}{" "}
                  de {totalItems} propriedades
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-8 sm:w-8"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                    <span className="sr-only">Primeira página</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-8 sm:w-8"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Página anterior</span>
                  </Button>
                  <span className="flex items-center gap-1 text-sm px-2">
                    <span className="hidden sm:inline">Página</span>{" "}
                    {currentPage} <span className="hidden sm:inline">de</span>{" "}
                    <span className="sm:hidden">/</span> {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-8 sm:w-8"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Próxima página</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-8 sm:w-8"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                    <span className="sr-only">Última página</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="Nenhuma propriedade encontrada"
            description={
              isFiltering
                ? "Tente ajustar seus filtros para encontrar o que está procurando."
                : "Comece cadastrando sua primeira propriedade."
            }
            icon={
              <Search
                size={48}
                className="text-muted-foreground dark:text-muted-foreground/70"
              />
            }
            action={
              isFiltering ? (
                <Button
                  onClick={clearFilters}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                >
                  Limpar filtros
                </Button>
              ) : (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Nova Propriedade
                </Button>
              )
            }
          />
        )}
      </CardContent>

      {/* Edit Property Modal */}
      {editingProperty && (
        <PropertyFormModal
          organizationId={organizationId}
          property={editingProperty}
          open={!!editingProperty}
          onOpenChange={(open) => !open && setEditingProperty(null)}
          mode="edit"
          onSuccess={() => {
            setEditingProperty(null);
            router.refresh();
          }}
        />
      )}

      {/* Import Dialog */}
      <PropertyImportDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        organizationId={organizationId}
        onSuccess={handleImportSuccess}
      />
    </Card>
  );
}
