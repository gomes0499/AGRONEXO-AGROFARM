"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getSafras, type Safra } from "@/lib/actions/production-actions";
import { getScenarios } from "@/lib/actions/scenario-actions-v2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SRPrimeEvaluationModalProps {
  organizationId: string;
  metric: {
    id: string;
    codigo: string;
    nome: string;
    descricao: string;
    score_criteria: any;
    peso: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SRPrimeEvaluationModal({
  organizationId,
  metric,
  isOpen,
  onClose,
  onSuccess,
}: SRPrimeEvaluationModalProps) {
  const [safras, setSafras] = useState<Safra[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedSafra, setSelectedSafra] = useState<string>("");
  const [selectedScenario, setSelectedScenario] = useState<string>("base");
  const [score, setScore] = useState<string>("");
  const [justification, setJustification] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, organizationId]);

  useEffect(() => {
    if (selectedSafra && selectedScenario) {
      loadExistingEvaluation();
    }
  }, [selectedSafra, selectedScenario, metric.codigo]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [safrasData, scenariosData] = await Promise.all([
        getSafras(organizationId),
        getScenarios(organizationId)
      ]);
      
      const activeSafras = safrasData.filter(s => s.ativa !== false);
      setSafras(activeSafras);
      setScenarios(scenariosData || []);
      
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

  const loadExistingEvaluation = async () => {
    try {
      const supabase = createClient();
      const scenarioId = selectedScenario === "base" ? null : selectedScenario;
      
      const query = supabase
        .from("rating_manual_evaluations")
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("safra_id", selectedSafra)
        .eq("metric_code", metric.codigo);

      if (scenarioId) {
        query.eq("scenario_id", scenarioId);
      } else {
        query.is("scenario_id", null);
      }

      const { data, error } = await query.single();
      
      if (data && !error) {
        setScore(data.score.toString());
        setJustification(data.justification || "");
      } else {
        setScore("");
        setJustification("");
      }
    } catch (error) {
      // No existing evaluation
      setScore("");
      setJustification("");
    }
  };

  const handleSave = async () => {
    if (!selectedSafra || !score) {
      toast.error("Selecione uma safra e uma nota");
      return;
    }

    try {
      setIsSaving(true);
      const supabase = createClient();
      const scenarioId = selectedScenario === "base" ? null : selectedScenario;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const evaluation = {
        organizacao_id: organizationId,
        safra_id: selectedSafra,
        scenario_id: scenarioId,
        metric_code: metric.codigo,
        score: parseInt(score),
        justification: justification || null,
        evaluated_by: user?.id || null,
        evaluated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("rating_manual_evaluations")
        .upsert(evaluation, {
          onConflict: "organizacao_id,safra_id,metric_code,scenario_id",
        });

      if (error) throw error;

      toast.success("Avaliação salva com sucesso");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast.error("Erro ao salvar avaliação");
    } finally {
      setIsSaving(false);
    }
  };

  const criteria = metric.score_criteria || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{metric.nome}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {metric.descricao}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
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

              <div>
                <Label htmlFor="scenario">Cenário</Label>
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger id="scenario">
                    <SelectValue placeholder="Selecione um cenário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Cenário Base</SelectItem>
                    {scenarios.map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Avaliação (1-5)</Label>
              <RadioGroup value={score} onValueChange={setScore} className="mt-2">
                {[5, 4, 3, 2, 1].map((value) => (
                  <div key={value} className="flex items-start space-x-3 py-2">
                    <RadioGroupItem value={value.toString()} id={`score-${value}`} />
                    <Label
                      htmlFor={`score-${value}`}
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-medium">{value} - </span>
                      <span className="text-muted-foreground">
                        {criteria[value] || `Nota ${value}`}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="justification">Justificativa (opcional)</Label>
              <Textarea
                id="justification"
                placeholder="Explique a razão desta avaliação..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading || !score}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Avaliação
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}