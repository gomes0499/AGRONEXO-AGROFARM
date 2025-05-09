"use client";

import { useState } from "react";
import {
  UserPlus,
  Search,
  Filter,
  Calendar,
  Clock,
  UserCircle2,
} from "lucide-react";
import { UserRole } from "@/lib/auth/roles";
import { MemberActions } from "./member-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { InviteDialog } from "@/components/organization/invite-dialog";

interface Member {
  id: string;
  usuario_id: string;
  organizacao_id: string;
  funcao: string;
  eh_proprietario: boolean;
  ultimo_login?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    nome: string;
  };
}

type OrganizationDetailMembersProps = {
  members: Member[];
  organizationId: string;
  organizationName?: string;
};

export function OrganizationDetailMembers({
  members,
  organizationId,
  organizationName,
}: OrganizationDetailMembersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  // Function to get the status badge for last login
  const getLastLoginStatus = (lastLogin?: string) => {
    if (!lastLogin) {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100/50 text-yellow-800 hover:bg-yellow-100/50 dark:bg-yellow-900/40 dark:text-yellow-300 dark:hover:bg-yellow-900/40"
        >
          <Clock className="mr-1 h-3 w-3" />
          Nunca acessou
        </Badge>
      );
    }

    const daysSinceLogin = Math.floor(
      (new Date().getTime() - new Date(lastLogin).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceLogin < 1) {
      return (
        <Badge
          variant="outline"
          className="bg-green-100/50 text-green-800 hover:bg-green-100/50 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/40"
        >
          <Clock className="mr-1 h-3 w-3" />
          Hoje
        </Badge>
      );
    } else if (daysSinceLogin < 7) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-100/50 text-blue-800 hover:bg-blue-100/50 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
        >
          <Calendar className="mr-1 h-3 w-3" />
          {daysSinceLogin} {daysSinceLogin === 1 ? "dia" : "dias"} atrás
        </Badge>
      );
    } else if (daysSinceLogin < 30) {
      return (
        <Badge
          variant="outline"
          className="bg-purple-100/50 text-purple-800 hover:bg-purple-100/50 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/40"
        >
          <Calendar className="mr-1 h-3 w-3" />
          {Math.floor(daysSinceLogin / 7)}{" "}
          {Math.floor(daysSinceLogin / 7) === 1 ? "semana" : "semanas"} atrás
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-gray-100/50 text-gray-800 hover:bg-gray-100/50 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800/80"
        >
          <Calendar className="mr-1 h-3 w-3" />
          {new Date(lastLogin).toLocaleDateString()}
        </Badge>
      );
    }
  };

  // Function to get initial letters for avatar
  const getInitials = (member: Member) => {
    if (member.user?.nome) {
      const nameParts = member.user.nome.split(" ");
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${
          nameParts[nameParts.length - 1][0]
        }`.toUpperCase();
      }
      return member.user.nome.substring(0, 2).toUpperCase();
    }

    if (member.user?.email) {
      return member.user.email.substring(0, 2).toUpperCase();
    }

    return "U";
  };

  // Function to get avatar color based on role
  const getAvatarColor = (role: string) => {
    switch (role) {
      case UserRole.PROPRIETARIO:
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
      case UserRole.ADMINISTRADOR:
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Function to get role display name
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

  // Function to get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case UserRole.PROPRIETARIO:
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
          >
            {getRoleDisplayName(role)}
          </Badge>
        );
      case UserRole.ADMINISTRADOR:
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60"
          >
            {getRoleDisplayName(role)}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {getRoleDisplayName(role)}
          </Badge>
        );
    }
  };

  // Filter members based on search query and role filter
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      !searchQuery ||
      member.user?.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = !roleFilter || member.funcao === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Get unique roles for filter
  const uniqueRoles = Array.from(
    new Set(members.map((member) => member.funcao))
  );

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <UserCircle2 className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Membros</CardTitle>
            <CardDescription>Pessoas com acesso à organização</CardDescription>
          </div>
        </div>
        <InviteDialog
          organizationId={organizationId}
          organizationName={organizationName}
        />
      </CardHeader>
      <CardContent>
        {members && members.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Buscar por nome ou email..."
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
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Email
                    </TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Último Acesso
                    </TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member: Member) => (
                      <TableRow key={member.id} className="group">
                        <TableCell className="flex items-center gap-2">
                          <Avatar
                            className={`h-8 w-8 ${getAvatarColor(
                              member.funcao
                            )} transition-transform group-hover:scale-110`}
                          >
                            <AvatarFallback>
                              {getInitials(member)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium truncate">
                              {member.user?.nome ||
                                member.user?.email?.split("@")[0] ||
                                "Usuário"}
                            </span>
                            <span className="text-xs text-muted-foreground md:hidden truncate">
                              {member.user?.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground truncate hidden md:table-cell">
                          {member.user?.email}
                        </TableCell>
                        <TableCell>{getRoleBadge(member.funcao)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {getLastLoginStatus(member.ultimo_login)}
                        </TableCell>
                        <TableCell className="text-center">
                          <MemberActions
                            associacaoId={member.id}
                            organizacaoId={member.organizacao_id}
                            memberEmail={member.user?.email}
                            memberName={member.user?.nome || "Usuário"}
                            memberRole={member.funcao}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Nenhum resultado encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              {filteredMembers.length}{" "}
              {filteredMembers.length === 1 ? "membro" : "membros"}
              {roleFilter
                ? ` com função ${getRoleDisplayName(roleFilter)}`
                : ""}
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
            <div className="bg-muted/50 p-4 rounded-full">
              <UserCircle2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">
                Nenhum membro encontrado além de você
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Convide pessoas para colaborar na sua organização
              </p>
            </div>
            <InviteDialog
              organizationId={organizationId}
              organizationName={organizationName}
              trigger={
                <Button>
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
