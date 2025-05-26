"use client";

import { useState } from "react";
import {
  MoreHorizontalIcon,
  Trash2Icon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { toast } from "sonner";
import { removeMember } from "@/lib/actions/organization-actions";
import { UserRole } from "@/lib/auth/roles";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

interface MemberActionsProps {
  associacaoId: string;
  organizacaoId: string;
  memberEmail: string;
  memberName: string;
  memberRole: string;
  onViewDetails?: () => void;
}

export function MemberActions({
  associacaoId,
  organizacaoId,
  memberEmail,
  memberName,
  memberRole,
  onViewDetails,
}: MemberActionsProps) {
  const router = useRouter();
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      router.push(
        `/dashboard/organization/${organizacaoId}/member/${associacaoId}`
      );
    }
  };

  // Para proprietários, mostrar um botão desabilitado com tooltip
  if (memberRole === UserRole.PROPRIETARIO) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-50 cursor-not-allowed"
              disabled
            >
              <ShieldIcon className="h-4 w-4" />
              <span className="sr-only">Proprietário protegido</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Proprietários não podem ser removidos</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Função para remover o membro
  const handleRemoveMember = async () => {
    setIsRemoving(true);

    const formData = new FormData();
    formData.append("associacaoId", associacaoId);
    formData.append("organizacaoId", organizacaoId);

    try {
      const result = await removeMember(formData);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        setIsRemoveDialogOpen(false);
      }
    } catch (error) {
      toast.error("Erro ao remover membro");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Mais opções"
          >
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewDetails}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Ver detalhes</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsRemoveDialogOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            <span>Remover membro</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Diálogo de confirmação para remover membro */}
      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{memberName}</strong> (
              {memberEmail}) da organização? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemoveMember();
              }}
              disabled={isRemoving}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isRemoving ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
