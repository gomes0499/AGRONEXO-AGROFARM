"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  ArrowUpDown,
  ExternalLink,
  Mail,
  Info,
  MessageCircle,
  Phone,
  MapPin,
  Globe,
  MoreHorizontal,
  Edit,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewOrganizationButton } from "@/components/organization/organization/new-button";
import { OrganizationFormDrawer } from "@/components/organization/organization/form-drawer";

type Organization = {
  id: string;
  nome: string;
  slug: string;
  email?: string;
  telefone?: string;
  website?: string;
  cnpj?: string;
  cpf?: string;
  logo?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

type OrganizationListProps = {
  organizations: Organization[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  userId?: string;
};

export function OrganizationList({
  organizations,
  isLoading = false,
  userId,
}: OrganizationListProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Organization;
    direction: "ascending" | "descending";
  }>({ key: "nome", direction: "ascending" });

  const [editingOrganization, setEditingOrganization] =
    useState<Organization | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Função para alternar a ordenação
  const requestSort = (key: keyof Organization) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Ordena as organizações
  const sortedOrganizations = useMemo(() => {
    if (!organizations) return [];

    const sorted = [...organizations];

    // Ordena as organizações
    if (sortConfig.key) {
      sorted.sort((a, b) => {
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

    return sorted;
  }, [organizations, sortConfig]);

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

  // Função para formatar telefone para WhatsApp
  const formatWhatsAppNumber = (phone: string) => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, "");
    // Adiciona código do país (55) se não tiver
    return cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  };

  // Função para gerar link do WhatsApp
  const getWhatsAppLink = (org: Organization) => {
    if (!org.telefone) return null;
    const phoneNumber = formatWhatsAppNumber(org.telefone);
    const message = encodeURIComponent(
      `Olá! Entrei em contato através do sistema da ${org.nome}. Como posso ser ajudado?`
    );
    return `https://wa.me/${phoneNumber}?text=${message}`;
  };

  // Função para formatar telefone para exibição
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return "";

    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, "");

    // Formato para celular (11 dígitos): (XX) XXXXX-XXXX
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
        7
      )}`;
    }

    // Formato para telefone fixo (10 dígitos): (XX) XXXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(
        6
      )}`;
    }

    // Se não conseguir formatar, retorna o original
    return phone;
  };

  // Função para abrir drawer de edição
  const handleEditOrganization = (org: Organization) => {
    setEditingOrganization(org);
    setIsEditDrawerOpen(true);
  };

  // Função para fechar drawer de edição
  const handleCloseEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingOrganization(null);
  };

  // Renderiza o cabeçalho da tabela com opções de ordenação
  const renderSortableHeader = (label: string, key: keyof Organization) => (
    <div
      className="flex items-center gap-1 cursor-pointer hover:text-white/80 transition-colors"
      onClick={() => requestSort(key)}
    >
      {label}
      <ArrowUpDown
        className={`h-4 w-4 ${
          sortConfig.key === key ? "text-white" : "text-white/70"
        }`}
      />
    </div>
  );

  // Renderiza o estado vazio
  const renderEmptyState = () => (
    <div className="h-[300px] flex items-center justify-center">
      <EmptyState
        icon={<Building2 className="h-10 w-10 text-muted-foreground" />}
        title="Nenhuma organização cadastrada"
        description="Crie sua primeira organização para começar a gerenciar seus dados. Use o botão no topo da página."
      />
    </div>
  );

  // Renderiza o estado de carregamento
  const renderLoadingState = () =>
    Array(5)
      .fill(0)
      .map((_, index) => (
        <TableRow key={`loading-${index}`}>
          {/* Coluna Nome */}
          <TableCell className="font-medium">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-5 w-[30px] rounded-md" />
              </div>
            </div>
          </TableCell>
          {/* Coluna Telefone */}
          <TableCell className="text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </TableCell>
          {/* Coluna Email */}
          <TableCell className="text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5 rounded-sm" />
              <Skeleton className="h-4 w-[160px]" />
            </div>
          </TableCell>
          {/* Coluna Localização */}
          <TableCell className="text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5 rounded-sm" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </TableCell>
          {/* Coluna Ações */}
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-2">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ));

  return (
    <TooltipProvider>
      <Card className="border-border/50 hover:shadow-md transition-shadow">
        <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Organizações
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Lista de todas as organizações cadastradas no sistema.
                      Gerencie membros, configurações e dados de cada
                      organização.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription className="text-white/80">
                Gerencie organizações e seus membros
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userId && (
              <NewOrganizationButton
                userId={userId}
                variant="secondary"
                className="gap-1"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="mt-4">
          <div className="space-y-6">
            {isLoading ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-primary rounded-t-md">
                    <TableRow className="border-b-0 hover:bg-primary">
                      <TableHead className="text-white font-semibold first:rounded-tl-md">
                        {renderSortableHeader("Nome", "nome")}
                      </TableHead>
                      <TableHead className="text-white font-semibold">
                        {renderSortableHeader("Telefone", "telefone")}
                      </TableHead>
                      <TableHead className="text-white font-semibold">
                        {renderSortableHeader("Email", "email")}
                      </TableHead>
                      <TableHead className="text-white font-semibold">
                        {renderSortableHeader("Localização", "cidade")}
                      </TableHead>
                      <TableHead className="text-white font-semibold text-right last:rounded-tr-md">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{renderLoadingState()}</TableBody>
                </Table>
              </div>
            ) : sortedOrganizations.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-primary rounded-t-md">
                    <TableRow className="border-b-0 hover:bg-primary">
                      <TableHead className="text-white font-semibold first:rounded-tl-md">
                        {renderSortableHeader("Nome", "nome")}
                      </TableHead>
                      <TableHead className="text-white font-semibold">
                        {renderSortableHeader("Telefone", "telefone")}
                      </TableHead>
                      <TableHead className="text-white font-semibold">
                        {renderSortableHeader("Email", "email")}
                      </TableHead>
                      <TableHead className="text-white font-semibold">
                        {renderSortableHeader("Localização", "cidade")}
                      </TableHead>
                      <TableHead className="text-white font-semibold text-right last:rounded-tr-md">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrganizations.map((org) => (
                      <TableRow key={org.id} className="group">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar
                              className={`h-10 w-10 rounded-md  ${getAvatarColor(
                                org.nome
                              )}`}
                            >
                              <AvatarImage
                                src={org.logo || ""}
                                alt={`Logo de ${org.nome}`}
                              />
                              <AvatarFallback>
                                {getInitials(org.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {org.nome || "Sem nome"}
                              </span>
                              <Badge
                                variant="default"
                                className="w-fit text-xs mt-1"
                              >
                                {getOrganizationType(org)}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {org.telefone ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{formatPhoneDisplay(org.telefone)}</span>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-700"
                                    asChild
                                  >
                                    <a
                                      href={getWhatsAppLink(org) || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Enviar mensagem no WhatsApp</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            "-"
                          )}
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
                        <TableCell className="text-muted-foreground">
                          {org.cidade || org.estado ? (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>
                                {[org.cidade, org.estado]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {org.website && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    asChild
                                  >
                                    <a
                                      href={org.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Globe className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visitar website</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/dashboard/organization/${org.id}`}
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Gerenciar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditOrganization(org)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              renderEmptyState()
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drawer de Edição */}
      <OrganizationFormDrawer
        isOpen={isEditDrawerOpen}
        onClose={handleCloseEditDrawer}
        organizationData={editingOrganization}
        userId={userId}
        mode="edit"
      />
    </TooltipProvider>
  );
}
