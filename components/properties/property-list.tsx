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
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatArea } from "@/lib/utils/formatters";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
}

export function PropertyList({ properties }: PropertyListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<PropertyType | "ALL">("ALL");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(
    null
  );
  const router = useRouter();

  // Usando useCallback para funções que não mudam frequentemente
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setTypeFilter("ALL");
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const handleTypeChange = useCallback((value: string) => {
    setTypeFilter(value as PropertyType | "ALL");
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
        property.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.proprietario.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "ALL" || property.tipo === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [properties, searchTerm, typeFilter]);

  const isFiltering = searchTerm || typeFilter !== "ALL";

  // Determine property type label and badge variant
  const propertyTypeInfo = {
    PROPRIO: { label: "Próprio", variant: "default" as const },
    ARRENDADO: { label: "Arrendado", variant: "secondary" as const },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center">
        <Button asChild>
          <Link href="/dashboard/properties/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            Nova Propriedade
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
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
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os tipos</SelectItem>
            <SelectItem value="PROPRIO">Próprias</SelectItem>
            <SelectItem value="ARRENDADO">Arrendadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isFiltering && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredProperties.length}
            {filteredProperties.length === 1
              ? " propriedade encontrada"
              : " propriedades encontradas"}
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      )}

      {filteredProperties.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Área Total</TableHead>
                <TableHead>Área Cultivada</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => {
                const typeInfo =
                  propertyTypeInfo[property.tipo] || propertyTypeInfo.PROPRIO;

                return (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">
                      {property.nome}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
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
                    <TableCell>{formatArea(property.area_cultivada)}</TableCell>
                    <TableCell>{property.proprietario}</TableCell>
                    <TableCell>
                      {property.valor_atual
                        ? formatCurrency(property.valor_atual)
                        : "-"}
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

                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/properties/${property.id}/edit`}
                                className="flex cursor-pointer items-center"
                              >
                                <EditIcon size={14} className="mr-2" />
                                Editar
                              </Link>
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
                                    <Trash2Icon size={14} className="mr-2" />
                                  )}
                                  {isDeleting &&
                                  deletingPropertyId === property.id
                                    ? "Excluindo..."
                                    : "Excluir"}
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Excluir propriedade
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a propriedade
                                    &quot;
                                    {property.nome}&quot;? Esta ação não pode
                                    ser desfeita e removerá todos os dados
                                    relacionados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                {deleteError && (
                                  <div className="flex items-center gap-2 p-3 text-sm bg-destructive/10 text-destructive rounded-md">
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
                                      handleDelete(property.id!, property.nome)
                                    }
                                    className={cn(
                                      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                                      isDeleting &&
                                        deletingPropertyId === property.id &&
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
      ) : (
        <EmptyState
          title="Nenhuma propriedade encontrada"
          description={
            isFiltering
              ? "Tente ajustar seus filtros para encontrar o que está procurando."
              : "Comece cadastrando sua primeira propriedade."
          }
          icon={<Search size={48} className="text-muted-foreground" />}
          action={
            isFiltering ? (
              <Button onClick={clearFilters}>Limpar filtros</Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/properties/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Nova Propriedade
                </Link>
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
