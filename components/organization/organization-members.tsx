"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { UserRole } from "@/lib/auth/roles";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type OrganizationMembersProps = {
  members: any[];
  isOwnerOrAdmin: boolean;
};

export function OrganizationMembers({
  members,
  isOwnerOrAdmin,
}: OrganizationMembersProps) {
  // Function to get the status badge for last login
  const getLastLoginStatus = (lastLogin?: string) => {
    if (!lastLogin) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
          Nunca acessou
        </span>
      );
    }

    const daysSinceLogin = Math.floor(
      (new Date().getTime() - new Date(lastLogin).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceLogin < 1) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
          Hoje
        </span>
      );
    } else if (daysSinceLogin < 7) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          {daysSinceLogin} {daysSinceLogin === 1 ? "dia" : "dias"} atrás
        </span>
      );
    } else if (daysSinceLogin < 30) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
          {Math.floor(daysSinceLogin / 7)}{" "}
          {Math.floor(daysSinceLogin / 7) === 1 ? "semana" : "semanas"} atrás
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          {new Date(lastLogin).toLocaleDateString()}
        </span>
      );
    }
  };

  // Function to get initial letters for avatar
  const getInitials = (member: any) => {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
        <div>
          <CardTitle>Membros</CardTitle>
          <CardDescription>
            Pessoas com acesso à sua organização
          </CardDescription>
        </div>
        {isOwnerOrAdmin && (
          <Button asChild size="sm">
            <Link href="/dashboard/organization/invite">
              <UserPlus className="mr-2 h-4 w-4" />
              Convidar
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {members.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  {isOwnerOrAdmin && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="flex items-center gap-2">
                      <Avatar
                        className={`h-8 w-8 ${getAvatarColor(member.funcao)}`}
                      >
                        <AvatarFallback>{getInitials(member)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate">
                        {member.user?.nome ||
                          member.user?.email?.split("@")[0] ||
                          "Usuário"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate">
                      {member.user?.email}
                    </TableCell>
                    <TableCell>
                      {getRoleDisplayName(member.funcao)}
                    </TableCell>
                    <TableCell>
                      {getLastLoginStatus(member.ultimo_login)}
                    </TableCell>
                    {isOwnerOrAdmin && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {member.funcao !== UserRole.PROPRIETARIO && (
                              <>
                                <DropdownMenuItem>Editar função</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  Remover
                                </DropdownMenuItem>
                              </>
                            )}
                            {member.funcao === UserRole.PROPRIETARIO && (
                              <DropdownMenuItem disabled>
                                Não é possível editar o proprietário
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Nenhum membro encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
