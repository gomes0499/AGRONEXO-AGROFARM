"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createRatingMetric } from "@/lib/actions/flexible-rating-actions";
import type { RatingMetric, CreateRatingMetric } from "@/schemas/rating";

interface CreateMetricDialogProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (metric: RatingMetric) => void;
}

export function CreateMetricDialog({
  organizationId,
  isOpen,
  onClose,
  onSuccess,
}: CreateMetricDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateRatingMetric>>({
    tipo: "QUALITATIVE",
    categoria: "GOVERNANCA",
    nome: "",
    codigo: "",
    descricao: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.codigo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsLoading(true);
      
      const newMetric = await createRatingMetric({
        ...formData,
        organizacao_id: organizationId,
        is_predefined: false,
      } as CreateRatingMetric);

      toast.success("Métrica criada com sucesso");
      onSuccess(newMetric);
      
      // Reset form
      setFormData({
        tipo: "QUALITATIVE",
        categoria: "GOVERNANCA",
        nome: "",
        codigo: "",
        descricao: "",
      });
    } catch (error) {
      console.error("Error creating metric:", error);
      toast.error("Erro ao criar métrica");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Métrica</DialogTitle>
          <DialogDescription>
            Defina uma nova métrica personalizada para seus modelos de rating
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value as any })}
              >
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUANTITATIVE">Quantitativa</SelectItem>
                  <SelectItem value="QUALITATIVE">Qualitativa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value as any })}
              >
                <SelectTrigger id="categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIQUIDEZ">Liquidez</SelectItem>
                  <SelectItem value="ENDIVIDAMENTO">Endividamento</SelectItem>
                  <SelectItem value="RENTABILIDADE">Rentabilidade</SelectItem>
                  <SelectItem value="EFICIENCIA">Eficiência</SelectItem>
                  <SelectItem value="GOVERNANCA">Governança</SelectItem>
                  <SelectItem value="OPERACIONAL">Operacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Gestão de Riscos"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              placeholder="Ex: GESTAO_RISCOS"
              required
            />
            <p className="text-xs text-muted-foreground">
              Use apenas letras maiúsculas e underscore
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o que esta métrica avalia..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Métrica"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}