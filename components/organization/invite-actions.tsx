"use client";

import * as React from "react";
import { MoreHorizontal, Send, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { resendInvite, cancelInvite } from "@/lib/auth/actions/auth-actions";

interface InviteActionsProps {
  inviteId: string;
  inviteEmail: string;
  lastSent: string;
}

export function InviteActions({
  inviteId,
  inviteEmail,
  lastSent,
}: InviteActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);

  // Formatar a data do último envio para exibição
  const lastSentDate = new Date(lastSent);

  const relativeLastSent = formatDistance(lastSentDate, new Date(), {
    addSuffix: true,
    locale: ptBR,
  });

  const handleResend = async () => {
    try {
      setLoading("resend");
      const result = await resendInvite(inviteId);

      if (result.success) {
        toast.success("Convite reenviado com sucesso");
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao reenviar convite");
      }
    } catch (error) {
      console.error("Erro ao reenviar convite:", error);
      toast.error("Erro ao reenviar convite");
    } finally {
      setLoading(null);
    }
  };

  const handleCancelConfirm = async () => {
    try {
      setLoading("cancel");
      const result = await cancelInvite(inviteId);

      if (result.success) {
        toast.success("Convite cancelado com sucesso");
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao cancelar convite");
      }
    } catch (error) {
      console.error("Erro ao cancelar convite:", error);
      toast.error("Erro ao cancelar convite");
    } finally {
      setLoading(null);
      setCancelDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleResend}
            disabled={loading === "resend"}
            className="cursor-pointer"
          >
            <Send className="mr-2 h-4 w-4" />
            <span>Reenviar convite</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setCancelDialogOpen(true)}
            disabled={loading === "cancel"}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Cancelar convite</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-default opacity-70">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Enviado {relativeLastSent}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Convite</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o convite enviado para{" "}
              <strong>{inviteEmail}</strong>? Esta ação marcará o convite como
              recusado e o usuário não poderá mais aceitar o convite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={loading === "cancel"}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading === "cancel" ? "Cancelando..." : "Cancelar Convite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
