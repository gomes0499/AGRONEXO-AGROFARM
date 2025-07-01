"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createProjection } from "@/lib/actions/projections-actions";

interface NewProjectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NewProjectionModal({
  open,
  onOpenChange,
  onSuccess,
}: NewProjectionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      toast.error("Por favor, insira um nome para o cenário");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createProjection(nome.trim(), descricao.trim() || undefined);
      
      if (result.error) {
        throw new Error("Erro ao criar cenário");
      }

      toast.success("Cenário criado com sucesso!");
      
      // Limpar formulário
      setNome("");
      setDescricao("");
      
      // Fechar modal
      onOpenChange(false);
      
      // Callback de sucesso
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar cenário:", error);
      toast.error("Erro ao criar cenário. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo Cenário</DialogTitle>
            <DialogDescription>
              Crie um novo cenário baseado nos dados atuais. Todos os dados de áreas de plantio, 
              produtividade, custos e preços serão copiados para este cenário.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Cenário</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Cenário Safra 2025/26"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o objetivo deste cenário..."
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Cenário"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}