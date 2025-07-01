"use client";

import type React from "react";
import { useState, useCallback, useEffect, useTransition } from "react";
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Upload,
  Search,
  Home,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteProperty, getProperties } from "@/lib/actions/property-actions";

interface PropertyListProps {
  organizationId: string;
  initialProperties: Property[];
  error?: string;
}

export function PropertyList({ 
  organizationId,
  initialProperties,
  error: initialError
}: PropertyListProps) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<PropertyType | "all">("all");
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const router = useRouter();

  // Refresh data when needed
  const refreshData = useCallback(() => {
    startTransition(async () => {
      try {
        const newProperties = await getProperties(organizationId);
        setProperties(newProperties);
        setError(null);
      } catch (err) {
        console.error("❌ Erro ao atualizar propriedades:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao carregar dados";
        setError(`Erro ao buscar propriedades: ${errorMessage}`);
      }
    });
  }, [organizationId]);

  // Filtrar propriedades
  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.nome
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      property.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.estado?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "all" || property.tipo === selectedType;
    
    return matchesSearch && matchesType;
  });

  const handleDeleteProperty = useCallback(
    async (propertyId: string, propertyName: string) => {
      try {
        setIsDeleting(true);
        setDeletingPropertyId(propertyId);
        setDeleteError(null);
        await deleteProperty(propertyId);

        toast.success(
          `A propriedade "${propertyName}" foi excluída com sucesso.`
        );

        // Refresh data after deletion
        refreshData();
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
    [refreshData]
  );

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
      refreshData();
      toast.success(
        `${importedProperties.length} propriedades importadas com sucesso!`
      );
    },
    [refreshData]
  );

  const handlePropertySave = useCallback(() => {
    setIsPropertyModalOpen(false);
    refreshData();
  }, [refreshData]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType]);

  if (error) {
    return (
      <EmptyState
        icon={<AlertTriangleIcon className="h-10 w-10 text-destructive" />}
        title="Erro ao carregar propriedades"
        description={error}
        action={
          <Button onClick={refreshData} disabled={isPending}>
            {isPending ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
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
          <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Propriedades</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie suas propriedades rurais e arrendamentos
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsImportDialogOpen(true)}
                variant="outline"
                size="sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
              <Button 
                onClick={() => setIsPropertyModalOpen(true)}
                size="sm"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Nova Propriedade
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, cidade ou estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as PropertyType | "all")}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="PROPRIO">Própria</SelectItem>
                <SelectItem value="ARRENDADO">Arrendada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de propriedades */}
          {paginatedProperties.length === 0 ? (
            <EmptyState
              icon={<Home className="h-10 w-10 text-muted-foreground" />}
              title={
                searchTerm || selectedType !== "all"
                  ? "Nenhuma propriedade encontrada"
                  : "Nenhuma propriedade cadastrada"
              }
              description={
                searchTerm || selectedType !== "all"
                  ? "Tente ajustar os filtros para encontrar propriedades."
                  : "Comece adicionando sua primeira propriedade."
              }
              action={
                !searchTerm && selectedType === "all" ? (
                  <Button onClick={() => setIsPropertyModalOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Adicionar Propriedade
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Área Total</TableHead>
                      <TableHead className="text-right">Área Cultivada</TableHead>
                      <TableHead className="text-right">Valor Atual</TableHead>
                      <TableHead className="w-[50px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{property.nome}</p>
                              {property.numero_matricula && (
                                <p className="text-xs text-muted-foreground">
                                  Mat. {property.numero_matricula}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={property.tipo === "PROPRIO" ? "default" : "secondary"}
                          >
                            {property.tipo === "PROPRIO" ? "Própria" : "Arrendada"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {property.cidade}, {property.estado}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatArea(property.area_total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatArea(property.area_cultivada)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(property.valor_atual)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/properties/${property.id}`}>
                                  <EyeIcon className="mr-2 h-4 w-4" />
                                  Ver detalhes
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <EditIcon className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2Icon className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a propriedade "{property.nome}"?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  {deleteError && (
                                    <div className="text-sm text-destructive">
                                      {deleteError}
                                    </div>
                                  )}
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteProperty(property.id || '', property.nome)}
                                      disabled={isDeleting && deletingPropertyId === property.id}
                                    >
                                      {isDeleting && deletingPropertyId === property.id ? (
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} propriedades
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-sm px-2">
                        {currentPage} de {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <PropertyFormModal
        open={isPropertyModalOpen}
        onOpenChange={setIsPropertyModalOpen}
        onSuccess={handlePropertySave}
        organizationId={organizationId}
      />

      <PropertyImportDialog
        {...({} as any)}
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={handleImportSuccess}
        organizationId={organizationId}
      />
    </div>
  );
}