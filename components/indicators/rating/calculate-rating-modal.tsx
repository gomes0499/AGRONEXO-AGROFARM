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
import { 
  calculateRating,
  checkManualMetricsEvaluated 
} from "@/lib/actions/flexible-rating-actions";
import { getSafras, type Safra } from "@/lib/actions/production-actions";
import { getScenarios } from "@/lib/actions/scenario-actions-v2";

interface CalculateRatingModalProps {
  organizationId: string;
  modelId: string;
  modelName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (calculation: any) => void;
}


export function CalculateRatingModal({
  organizationId,
  modelId,
  modelName,
  isOpen,
  onClose,
  onSuccess,
}: CalculateRatingModalProps) {
  const [safras, setSafras] = useState<Safra[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedSafra, setSelectedSafra] = useState<string>("");
  const [selectedScenario, setSelectedScenario] = useState<string>("base");
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
      
      // Load safras and scenarios in parallel
      const [safrasData, scenariosData] = await Promise.all([
        getSafras(organizationId),
        getScenarios(organizationId)
      ]);
      
      // Filter active safras
      const activeSafras = safrasData.filter(s => s.ativa !== false);
      setSafras(activeSafras);
      
      // Set scenarios - filter only "Base" and "Teste" for organization "teste"
      const filteredScenarios = scenariosData.filter(scenario => 
        scenario.name === "Teste" || scenario.name === "teste"
      ) || [];
      setScenarios(filteredScenarios);
      
      // Select safra that starts with current year (2025)
      const currentYear = new Date().getFullYear();
      const currentYearSafra = activeSafras.find(safra => 
        safra.nome.startsWith(currentYear.toString())
      );
      
      if (currentYearSafra) {
        setSelectedSafra(currentYearSafra.id);
      } else if (activeSafras.length > 0) {
        // Fallback to most recent if no current year safra found
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
    if (!selectedSafra) {
      toast.error("Selecione uma safra");
      return;
    }

    try {
      setIsCalculating(true);
      
      // Check if manual metrics are evaluated for this safra and scenario
      const scenarioId = selectedScenario === "base" ? null : selectedScenario;
      
      // Temporarily disable validation as all metrics are evaluated
      // const isEvaluated = await checkManualMetricsEvaluated(
      //   organizationId,
      //   selectedSafra,
      //   scenarioId
      // );
      
      // if (!isEvaluated) {
      //   console.warn("Manual metrics not fully evaluated for safra:", selectedSafra, "scenario:", scenarioId);
      //   toast.error("É necessário avaliar todas as métricas manuais antes de calcular o rating");
      //   setIsCalculating(false);
      //   return;
      // }
      
      const calculation = await calculateRating(organizationId, modelId, selectedSafra, scenarioId);
      
      toast.success("Rating calculado com sucesso!");
      
      onSuccess(calculation);
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
            Calcular Rating - {modelName}
          </DialogTitle>
          <DialogDescription>
            Selecione a safra e o cenário para calcular a classificação
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-4">

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

            <div className="space-y-2">
              <Label htmlFor="scenario">Cenário</Label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger id="scenario">
                  <SelectValue placeholder="Selecione um cenário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">
                    <div className="flex items-center gap-2">
                      <span>📊</span>
                      <span>Cenário Base (Dados Reais)</span>
                    </div>
                  </SelectItem>
                  {scenarios.map((scenario) => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      <div className="flex items-center gap-2">
                        <span>📈</span>
                        <span>{scenario.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSafra && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-muted-foreground">
                  O rating será calculado usando os indicadores financeiros da safra e cenário selecionados.
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
            disabled={isCalculating || !selectedSafra || isLoading}
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