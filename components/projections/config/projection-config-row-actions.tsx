"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Copy, Star } from "lucide-react";

interface ProjecaoConfig {
  id: string;
  nome: string;
  descricao?: string;
  periodo_inicio: number;
  periodo_fim: number;
  formato_safra: "SAFRA_COMPLETA" | "ANO_CIVIL";
  status: "ATIVA" | "INATIVA" | "ARQUIVADA";
  eh_padrao: boolean;
}

interface ProjectionConfigRowActionsProps {
  config: ProjecaoConfig;
  onEdit: (config: ProjecaoConfig) => void;
  onDelete: (id: string) => void;
}

export function ProjectionConfigRowActions({
  config,
  onEdit,
  onDelete,
}: ProjectionConfigRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(config)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          Duplicar
        </DropdownMenuItem>
        {!config.eh_padrao && (
          <DropdownMenuItem>
            <Star className="mr-2 h-4 w-4" />
            Definir como Padrão
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(config.id)}
          className="text-destructive"
          disabled={config.eh_padrao}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}