"use client";

import { useState } from "react";
import {
  Calendar,
  Mail,
  Filter,
  Search,
  MailCheck,
  UserPlus,
  MailX,
} from "lucide-react";
import { UserRole } from "@/lib/auth/roles";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InviteActions } from "./actions";
import { InviteDialog } from "./dialog";

type Invite = {
  id: string;
  email: string;
  funcao: string;
  criado_em?: string;
  created_at?: string;
  ultimo_envio?: string;
  status?: string;
};

type OrganizationDetailInvitesProps = {
  invites: Invite[];
  organizationId: string;
  organizationName?: string;
};

export function OrganizationDetailInvites({
  invites,
  organizationId,
  organizationName,
}: OrganizationDetailInvitesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  // Função para obter o nome de exibição da função
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case UserRole.PROPRIETARIO:
        return "Proprietário";
      case UserRole.ADMINISTRADOR:
        return "Administrador";
      case UserRole.MEMBRO:
        return "Membro";
      default:
        return role;
    }
  };

  // Função para obter o badge da função
  const getRoleBadge = (role: string) => {
    return (
      <Badge variant="default" className="w-fit text-xs">
        {getRoleDisplayName(role)}
      </Badge>
    );
  };

  // Função para formatar a data de envio
  const formatSentDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  // Filtrar convites com base na busca e filtro de função
  const filteredInvites = invites.filter((invite) => {
    const matchesSearch =
      !searchQuery ||
      invite.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || invite.funcao === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Obter funções únicas para o filtro
  const uniqueRoles = Array.from(
    new Set(invites.map((invite) => invite.funcao))
  );

  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <MailCheck className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Convites</CardTitle>
            <CardDescription className="text-white/80">
              Convites pendentes para a organização
            </CardDescription>
          </div>
        </div>
        <div className="flex gap-2">
          <InviteDialog
            organizationId={organizationId}
            organizationName={organizationName || ""}
            trigger={
              <Button variant="outline" className="gap-1 bg-white text-black hover:bg-gray-100" size="default">
                <UserPlus className="h-4 w-4 mr-1" />
                Convidar Membro
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent className="mt-4">
        {invites && invites.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Buscar por email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex gap-2">
                    <Filter className="h-4 w-4" />
                    <span>
                      {roleFilter
                        ? getRoleDisplayName(roleFilter)
                        : "Filtrar por função"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por função</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setRoleFilter(null)}>
                      Todos
                    </DropdownMenuItem>
                    {uniqueRoles.map((role) => (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => setRoleFilter(role)}
                      >
                        {getRoleDisplayName(role)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-primary rounded-t-md">
                  <TableRow className="border-b-0 hover:bg-primary">
                    <TableHead className="text-white font-semibold first:rounded-tl-md">
                      Email
                    </TableHead>
                    <TableHead className="text-white font-semibold">
                      Função
                    </TableHead>
                    <TableHead className="text-white font-semibold">
                      Data de Envio
                    </TableHead>
                    <TableHead className="text-white font-semibold text-center last:rounded-tr-md">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvites.length > 0 ? (
                    filteredInvites.map((invite) => (
                      <TableRow key={invite.id} className="group">
                        <TableCell className="flex items-center gap-2">
                          <div className="bg-primary/10 rounded-full p-1.5">
                            <Mail className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium">{invite.email}</span>
                        </TableCell>
                        <TableCell>{getRoleBadge(invite.funcao)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {formatSentDate(
                                invite.criado_em || invite.created_at || ""
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <InviteActions
                            inviteId={invite.id}
                            inviteEmail={invite.email}
                            lastSent={
                              invite.ultimo_envio || invite.created_at || ""
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum resultado encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              {filteredInvites.length}{" "}
              {filteredInvites.length === 1 ? "convite" : "convites"} pendente
              {filteredInvites.length !== 1 ? "s" : ""}
              {roleFilter
                ? ` para função ${getRoleDisplayName(roleFilter)}`
                : ""}
            </div>
          </>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="bg-muted/50 p-4 rounded-full mb-4">
              <MailX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              Nenhum convite pendente
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Não há convites pendentes para esta organização. Use o botão
              "Convidar" na aba de Membros para adicionar novos usuários.
            </p>
            <InviteDialog
              organizationId={organizationId}
              organizationName={organizationName || ""}
              trigger={
                <Button variant="outline" className="bg-white text-black hover:bg-gray-100">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convidar Membros
                </Button>
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
