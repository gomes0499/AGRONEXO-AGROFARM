import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, Mail } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type OrganizationInvitesProps = {
  invites: any[];
};

export function OrganizationInvites({ invites }: OrganizationInvitesProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Convites</CardTitle>
        <CardDescription>
          Convites pendentes para sua organização
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
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
                    <TableCell className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {invite.email}
                    </TableCell>
                    <TableCell>
                      {invite.funcao === "PROPRIETARIO"
                        ? "Proprietário"
                        : invite.funcao === "ADMINISTRADOR"
                        ? "Administrador"
                        : "Membro"}
                    </TableCell>
                    <TableCell className="flex items-center space-x-1">
                      <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">
                        {new Date(invite.criado_em).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                        >
                          Reenviar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Nenhum convite pendente
          </div>
        )}
      </CardContent>
    </Card>
  );
}