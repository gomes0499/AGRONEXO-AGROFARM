"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MoreHorizontal, Trash2, Settings } from "lucide-react";
import { getProjections, deleteProjection, type Projection } from "@/lib/actions/projections-actions";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useScenarioLoading } from "@/hooks/use-scenario-loading";
import { PriceEditorModal } from "./price-editor-modal";

interface ProjectionSelectorProps {
  currentProjectionId?: string;
  organizationId?: string;
}

export function ProjectionSelector({
  currentProjectionId,
  organizationId,
}: ProjectionSelectorProps) {
  const [projections, setProjections] = useState<Projection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectionToDelete, setProjectionToDelete] = useState<{id: string, name: string} | null>(null);
  const [showPriceEditor, setShowPriceEditor] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setLoading: setScenarioLoading } = useScenarioLoading();
  const [isPending, startTransition] = useTransition();
  const [isChangingScenario, setIsChangingScenario] = useState(false);

  // Carregar projeções
  const loadProjections = async () => {
    try {
      const result = await getProjections();
      if (!result.error) {
        setProjections(result.data);
      }
    } catch (error) {
      console.error("Erro ao carregar projeções:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjections();
  }, []);

  // Monitorar quando a transição termina
  useEffect(() => {
    if (isChangingScenario && !isPending) {
      // A transição terminou, mas vamos aguardar um pouco mais para garantir
      // que todos os componentes foram atualizados
      const timer = setTimeout(() => {
        setScenarioLoading(false);
        setIsChangingScenario(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isPending, isChangingScenario, setScenarioLoading]);

  const handleProjectionChange = async (value: string) => {
    const projectionId = value === "current" ? undefined : value;
    
    // Mostrar loading imediatamente
    const selectedProjection = projections.find(p => p.id === value);
    const message = value === "current" 
      ? "Carregando dados atuais..." 
      : `Carregando cenário ${selectedProjection?.nome || ''}...`;
    
    setScenarioLoading(true, message);
    setIsChangingScenario(true);
    
    // Pequeno delay para garantir que o loading apareça antes de iniciar a transição
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Criar nova URLSearchParams a partir das atuais
    const params = new URLSearchParams(searchParams.toString());
    if (projectionId) {
      params.set("projection", projectionId);
    } else {
      params.delete("projection");
    }
    
    // Usar replace ao invés de push para evitar adicionar ao histórico
    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    
    // Use startTransition to batch the update
    startTransition(() => {
      router.replace(newUrl, { scroll: false });
    });
  };

  const handleProjectionCreated = () => {
    loadProjections();
  };

  const handleDeleteClick = (projectionId: string, projectionName: string) => {
    setProjectionToDelete({ id: projectionId, name: projectionName });
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectionToDelete) return;

    setIsDeleting(projectionToDelete.id);
    setShowDeleteDialog(false);

    try {
      const result = await deleteProjection(projectionToDelete.id);
      
      if (result.error) {
        throw new Error("Erro ao excluir cenário");
      }

      toast.success("Cenário excluído com sucesso!");
      
      // Se o cenário excluído era o atual, redirecionar para dados atuais
      if (currentProjectionId === projectionToDelete.id) {
        setScenarioLoading(true, "Voltando para dados atuais...");
        setIsChangingScenario(true);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("projection");
        const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        startTransition(() => {
          router.replace(newUrl, { scroll: false });
        });
      }
      
      // Recarregar lista de cenários
      loadProjections();
    } catch (error) {
      console.error("Erro ao excluir cenário:", error);
      toast.error("Erro ao excluir cenário. Tente novamente.");
    } finally {
      setIsDeleting(null);
      setProjectionToDelete(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Cenário:</span>
      </div>
      
      <Select
        value={currentProjectionId || "current"}
        onValueChange={handleProjectionChange}
        disabled={isLoading || isChangingScenario || isPending}
      >
        <SelectTrigger className="w-[200px] h-8 text-sm">
          <SelectValue placeholder="Selecione um cenário" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current">
            <div className="flex items-center gap-2">
              <span>Dados Atuais</span>
              <Badge variant="secondary" className="text-xs">Atual</Badge>
            </div>
          </SelectItem>
          
          {projections.length > 0 && (
            <div className="border-t my-1" />
          )}
          
          {projections.map((projection) => (
            <SelectItem key={projection.id} value={projection.id}>
              <div className="flex items-center gap-2">
                <span>{projection.nome}</span>
                {!projection.is_active && (
                  <Badge variant="outline" className="text-xs">Inativa</Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Botão de configurações para editar preços (apenas para cenários não-base) */}
      {currentProjectionId && organizationId && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setShowPriceEditor(true)}
          title="Editar preços do cenário"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}

      {/* Dropdown de ações para projeção selecionada */}
      {currentProjectionId && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={isDeleting === currentProjectionId}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                const projection = projections.find(p => p.id === currentProjectionId);
                if (projection) {
                  handleDeleteClick(projection.id, projection.nome);
                }
              }}
              className="text-destructive focus:text-destructive"
              disabled={isDeleting === currentProjectionId}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Cenário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Alert Dialog para confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cenário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cenário <strong>"{projectionToDelete?.name}"</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita e todos os dados deste cenário serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting === projectionToDelete?.id}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting === projectionToDelete?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting === projectionToDelete?.id ? "Excluindo..." : "Excluir Cenário"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de edição de preços */}
      {currentProjectionId && organizationId && (
        <PriceEditorModal
          open={showPriceEditor}
          onOpenChange={setShowPriceEditor}
          projectionId={currentProjectionId}
          projectionName={projections.find(p => p.id === currentProjectionId)?.nome || ""}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}