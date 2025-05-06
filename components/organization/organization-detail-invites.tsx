import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserRole } from "@/lib/auth/roles";
import { AlertCircle } from "lucide-react";
import { InviteActions } from "./invite-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type OrganizationDetailInvitesProps = {
  invites: any[];
};

export function OrganizationDetailInvites({
  invites,
}: OrganizationDetailInvitesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Convites</CardTitle>
        <CardDescription>Convites pendentes para a organização</CardDescription>
      </CardHeader>
      <CardContent>
        {invites && invites.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                      {invite.funcao === UserRole.PROPRIETARIO
                        ? "Proprietário"
                        : invite.funcao === UserRole.ADMINISTRADOR
                        ? "Administrador"
                        : "Membro"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(
                        invite.criado_em || invite.created_at
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <InviteActions
                        inviteId={invite.id}
                        inviteEmail={invite.email}
                        lastSent={invite.ultimo_envio || invite.created_at}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nenhum convite pendente</AlertTitle>
            <AlertDescription>
              Não há convites pendentes para esta organização. Use o botão
              "Convidar" na aba de Membros para adicionar novos usuários.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
