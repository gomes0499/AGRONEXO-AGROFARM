"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  Trash2,
  Mail,
  Hash,
  Filter,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

type Organization = {
  id: string;
  nome: string;
  slug: string;
  email?: string;
  telefone?: string;
  website?: string;
  cnpj?: string;
  cpf?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

type OrganizationListProps = {
  organizations: Organization[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
};

export function OrganizationList({
  organizations,
  isLoading = false,
  onDelete,
}: OrganizationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Organization;
    direction: "ascending" | "descending";
  }>({ key: "nome", direction: "ascending" });

  // Função para alternar a ordenação
  const requestSort = (key: keyof Organization) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Filtra e ordena as organizações
  const filteredAndSortedOrganizations = useMemo(() => {
    if (!organizations) return [];

    // Filtra as organizações com base na busca
    const filtered = organizations.filter((org) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (org.nome && org.nome.toLowerCase().includes(searchLower)) ||
        (org.slug && org.slug.toLowerCase().includes(searchLower)) ||
        (org.email && org.email.toLowerCase().includes(searchLower))
      );
    });

    // Ordena as organizações
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [organizations, searchQuery, sortConfig]);

  // Função para obter as iniciais do nome da organização
  const getInitials = (name: string) => {
    if (!name) return "OR";

    const words = name.split(" ");
    if (words.length === 1) {
      return name.substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Função para obter a cor do avatar com base no nome
  const getAvatarColor = (name: string) => {
    if (!name) return "bg-primary/10 text-primary";

    const colors = [
      "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
      "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
      "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
      "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    ];

    // Usa a soma dos códigos de caractere para determinar a cor
    const sum = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  // Função para determinar o tipo de organização
  const getOrganizationType = (org: Organization) => {
    if (org.cnpj) return "PJ";
    if (org.cpf) return "PF";
    return "N/A";
  };

  // Renderiza o cabeçalho da tabela com opções de ordenação
  const renderSortableHeader = (label: string, key: keyof Organization) => (
    <div
      className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
      onClick={() => requestSort(key)}
    >
      {label}
      <ArrowUpDown
        className={`h-4 w-4 ${
          sortConfig.key === key ? "text-primary" : "text-muted-foreground"
        }`}
      />
    </div>
  );

  // Renderiza o estado vazio
  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={4} className="h-[300px] text-center">
        <EmptyState
          icon={<Building2 className="h-10 w-10 text-muted-foreground" />}
          title="Nenhuma organização encontrada"
          description={
            searchQuery
              ? "Tente ajustar os termos da busca ou remover os filtros"
              : "Crie sua primeira organização para começar"
          }
          action={
            !searchQuery && (
              <Button asChild>
                <Link href="/dashboard/organization/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Organização
                </Link>
              </Button>
            )
          }
        />
      </TableCell>
    </TableRow>
  );

  // Renderiza o estado de carregamento
  const renderLoadingState = () =>
    Array(5)
      .fill(0)
      .map((_, index) => (
        <TableRow key={`loading-${index}`}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[180px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-[100px]" />
          </TableCell>
        </TableRow>
      ));

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Organizações</CardTitle>
              <CardDescription>Gerencie suas organizações</CardDescription>
            </div>
          </div>
          <Button asChild>
            <Link href="/dashboard/organization/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Organização
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar por nome, identificador ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="flex gap-2" disabled>
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtros</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filtros avançados em breve</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[33%]">
                  {renderSortableHeader("Nome", "nome")}
                </TableHead>
                <TableHead className="w-[25%]">
                  {renderSortableHeader("Identificador", "slug")}
                </TableHead>
                <TableHead className="w-[25%]">
                  {renderSortableHeader("Email", "email")}
                </TableHead>
                <TableHead className="w-[17%] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? renderLoadingState()
                : filteredAndSortedOrganizations.length > 0
                ? filteredAndSortedOrganizations.map((org) => (
                    <TableRow key={org.id} className="group">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar
                            className={`h-10 w-10 transition-transform group-hover:scale-110 ${getAvatarColor(
                              org.nome
                            )}`}
                          >
                            <AvatarFallback>
                              {getInitials(org.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {org.nome || "Sem nome"}
                            </span>
                            <Badge
                              variant="outline"
                              className="w-fit text-xs mt-1"
                            >
                              {getOrganizationType(org)}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5" />
                          <span>{org.slug || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {org.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            <span>{org.email}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
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
                                href={`/dashboard/organization/${org.id}`}
                                className="cursor-pointer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                <span>Gerenciar</span>
                              </Link>
                            </DropdownMenuItem>

                            {onDelete && (
                              <DropdownMenuItem
                                onClick={() => onDelete(org.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Excluir</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                : renderEmptyState()}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedOrganizations.length > 0 && (
          <div className="mt-3 text-sm text-muted-foreground">
            {filteredAndSortedOrganizations.length}{" "}
            {filteredAndSortedOrganizations.length === 1
              ? "organização"
              : "organizações"}{" "}
            encontrada
            {filteredAndSortedOrganizations.length !== 1 ? "s" : ""}
            {searchQuery && ` para "${searchQuery}"`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
