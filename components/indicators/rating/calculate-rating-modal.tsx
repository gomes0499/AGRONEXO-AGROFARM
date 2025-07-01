"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calculator, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { RatingModel } from "@/schemas/rating";
import { getRatingModels, calculateRating } from "@/lib/actions/flexible-rating-actions";
import { calculateQuantitativeMetricsOptimized } from "@/lib/actions/rating-metrics-calculations";
import { getSafras, type Safra } from "@/lib/actions/production-actions";

interface CalculateRatingModalProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}


export function CalculateRatingModal({
  organizationId,
  isOpen,
  onClose,
  onSuccess,
}: CalculateRatingModalProps) {
  const [models, setModels] = useState<RatingModel[]>([]);
  const [safras, setSafras] = useState<Safra[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedSafra, setSelectedSafra] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, organizationId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load models and safras in parallel
      const [modelsData, safrasData] = await Promise.all([
        getRatingModels(organizationId),
        getSafras(organizationId)
      ]);
      
      // Filter active models
      const activeModels = modelsData.filter(m => m.is_active);
      setModels(activeModels);
      
      // Filter active safras
      const activeSafras = safrasData.filter(s => s.ativa !== false);
      setSafras(activeSafras);
      
      // Select default model if available
      const defaultModel = activeModels.find(m => m.is_default);
      if (defaultModel) {
        setSelectedModel(defaultModel.id!);
      }
      
      // Select most recent safra
      if (activeSafras.length > 0) {
        setSelectedSafra(activeSafras[0].id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedModel || !selectedSafra) {
      toast.error("Selecione um modelo e uma safra");
      return;
    }

    try {
      setIsCalculating(true);
      
      // Use legacy method for stable rating calculation
      const calculation = await calculateRating(organizationId, selectedModel, selectedSafra);
      
      toast.success(
        `Rating calculado: ${calculation.rating_letra} (${calculation.pontuacao_total?.toFixed(1) || '0.0'} pontos)`
      );
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error calculating rating:", error);
      toast.error("Erro ao calcular rating");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calcular Rating
          </DialogTitle>
          <DialogDescription>
            Selecione o modelo de rating e a safra para calcular a classificação
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="model">Modelo de Rating</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id!}>
                      {model.nome}
                      {model.is_default && " (Padrão)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="safra">Safra</Label>
              <Select value={selectedSafra} onValueChange={setSelectedSafra}>
                <SelectTrigger id="safra">
                  <SelectValue placeholder="Selecione uma safra" />
                </SelectTrigger>
                <SelectContent>
                  {safras.map((safra) => (
                    <SelectItem key={safra.id} value={safra.id}>
                      {safra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedModel && selectedSafra && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-muted-foreground">
                  O rating será calculado usando os indicadores financeiros da safra selecionada.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isCalculating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCalculate} 
            disabled={isCalculating || !selectedModel || !selectedSafra || isLoading}
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calcular
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}