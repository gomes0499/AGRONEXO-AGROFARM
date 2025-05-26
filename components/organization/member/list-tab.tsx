"use client";

import { useState } from "react";
import { Calendar, Clock, UserCircle2, Shield, PlusCircle } from "lucide-react";
import { UserRole } from "@/lib/auth/roles";
import { MemberActions } from "./actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createAdminAccount } from "@/lib/actions/invitation-actions";
import { CardHeaderPrimary } from "../common/data-display/card-header-primary";
import { SearchAndFilterBar } from "../common/data-display/search-and-filter-bar";
import { TableHeaderPrimary } from "../common/data-display/table-header-primary";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { MemberFormDrawer } from "./form-drawer";
import { MemberDetailsModal } from "./details-modal";

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
    avatar?: string;
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
  const [isAdminCreateOpen, setIsAdminCreateOpen] = useState(false);
  const [isMemberDrawerOpen, setIsMemberDrawerOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<
    string | undefined
  >();

  // Function to get initial letters for avatar
  const getInitials = (member: Member) => {
    // Verificar se o nome existe e não é vazio
    if (member.user?.nome && member.user.nome.trim() !== "") {
      const nameParts = member.user.nome
        .split(" ")
        .filter((part) => part.trim() !== "");

      if (nameParts.length > 1) {
        // Pegar a primeira letra do primeiro e último nome
        return `${nameParts[0][0]}${
          nameParts[nameParts.length - 1][0]
        }`.toUpperCase();
      } else if (nameParts.length === 1) {
        // Se só tem um nome, pegar as duas primeiras letras
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    }

    // Se não tem nome, usar email
    if (member.user?.email && member.user.email.trim() !== "") {
      // Usar a primeira letra do email e a primeira letra após o @
      const emailParts = member.user.email.split("@");
      if (emailParts.length > 1 && emailParts[0].length > 0) {
        return emailParts[0].substring(0, 2).toUpperCase();
      }
      return member.user.email.substring(0, 2).toUpperCase();
    }

    // Fallback para user ID
    if (member.usuario_id) {
      return member.usuario_id.substring(0, 2).toUpperCase();
    }

    // Último recurso
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
    return (
      <Badge variant="default" className="w-fit text-xs">
        {getRoleDisplayName(role)}
      </Badge>
    );
  };

  // Function to format date of entry
  const formatEntryDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch (error) {
      return "-";
    }
  };

  // Function to get last login display
  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return "Nunca acessou";

    const daysSinceLogin = Math.floor(
      (new Date().getTime() - new Date(lastLogin).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceLogin < 1) {
      return "Hoje";
    } else if (daysSinceLogin < 7) {
      return `${daysSinceLogin} ${daysSinceLogin === 1 ? "dia" : "dias"} atrás`;
    } else if (daysSinceLogin < 30) {
      return `${Math.floor(daysSinceLogin / 7)} ${
        Math.floor(daysSinceLogin / 7) === 1 ? "semana" : "semanas"
      } atrás`;
    } else {
      return new Date(lastLogin).toLocaleDateString("pt-BR");
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

  // Handle viewing member details
  const handleViewMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setIsDetailsModalOpen(true);
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<UserCircle2 className="h-4 w-4" />}
        title="Membros"
        description="Pessoas com acesso à organização"
        action={
          <Button
            variant="secondary"
            className="gap-1"
            size="default"
            onClick={() => setIsMemberDrawerOpen(true)}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Novo Membro
          </Button>
        }
      />
      <CardContent className="mt-4">
        {members && members.length > 0 ? (
          <>
            <div className="mb-4">
              <SearchAndFilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar por nome ou email..."
                filterValue={roleFilter}
                onFilterChange={setRoleFilter}
                filterOptions={uniqueRoles.map((role) => ({
                  value: role,
                  label: getRoleDisplayName(role),
                }))}
              />
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeaderPrimary
                  headers={[
                    "Nome",
                    { label: "Email", className: "hidden md:table-cell" },
                    "Função",
                    {
                      label: "Data de Entrada",
                      className: "hidden sm:table-cell",
                    },
                    {
                      label: "Último Acesso",
                      className: "hidden lg:table-cell",
                    },
                    { label: "Ações", className: "text-center" },
                  ]}
                />
                <TableBody>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member: Member) => (
                      <TableRow
                        key={member.id}
                        className="group cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewMember(member.usuario_id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar
                              className={`h-8 w-8 rounded-md ${getAvatarColor(
                                member.funcao
                              )}`}
                            >
                              <AvatarImage
                                src={member.user?.avatar || ""}
                                alt={member.user?.nome || "Avatar"}
                              />
                              <AvatarFallback>
                                {getInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium truncate">
                                {member.user?.nome || "Usuário"}
                              </span>
                              <span className="text-xs text-muted-foreground md:hidden truncate">
                                {member.user?.email &&
                                !member.user.email.includes("exemplo.com")
                                  ? member.user.email
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground truncate hidden md:table-cell">
                          {member.user?.email &&
                          !member.user.email.includes("exemplo.com")
                            ? member.user.email
                            : "-"}
                        </TableCell>
                        <TableCell>{getRoleBadge(member.funcao)}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-sm">
                              {formatEntryDate(member.created_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-sm">
                              {formatLastLogin(member.ultimo_login)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MemberActions
                            associacaoId={member.id}
                            organizacaoId={member.organizacao_id}
                            memberEmail={member.user?.email}
                            memberName={member.user?.nome || "Usuário"}
                            memberRole={member.funcao}
                            onViewDetails={() =>
                              handleViewMember(member.usuario_id)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
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
            <div className="flex gap-3 flex-wrap justify-center">
              <Button onClick={() => setIsMemberDrawerOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Membro
              </Button>

              <Dialog
                open={isAdminCreateOpen}
                onOpenChange={setIsAdminCreateOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    Criar Admin Rápido
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        )}
      </CardContent>

      {/* Drawer de Novo Membro */}
      <MemberFormDrawer
        isOpen={isMemberDrawerOpen}
        onClose={() => setIsMemberDrawerOpen(false)}
        organizationId={organizationId}
        organizationName={organizationName}
      />

      {/* Modal de Detalhes do Membro */}
      <MemberDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedMemberId(undefined);
        }}
        memberId={selectedMemberId}
        organizationId={organizationId}
        organizationName={organizationName}
      />
    </Card>
  );
}
