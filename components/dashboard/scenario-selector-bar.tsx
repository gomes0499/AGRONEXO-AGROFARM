"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Settings, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScenarioEditorModal } from "./scenario-editor-modal";
import {
  getScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  saveHarvestScenarioData,
} from "@/lib/actions/scenario-actions";
import { getSafras } from "@/lib/actions/production-actions";

interface ScenarioSelectorBarProps {
  organizationId: string;
  onScenarioChange: (scenarioData: any) => void;
}

export function ScenarioSelectorBar({
  organizationId,
  onScenarioChange,
}: ScenarioSelectorBarProps) {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>("base");
  const [showEditor, setShowEditor] = useState(false);
  const [editingScenario, setEditingScenario] = useState<any>(null);
  const [safras, setSafras] = useState<any[]>([]);

  useEffect(() => {
    loadScenarios();
    loadSafras();
  }, [organizationId]);

  const loadSafras = async () => {
    try {
      const safrasData = await getSafras(organizationId);
      setSafras(safrasData || []);
    } catch (error) {
      console.error("Erro ao carregar safras:", error);
    }
  };

  const loadScenarios = async () => {
    try {
      // Carregar cenários do banco
      const dbScenarios = await getScenarios(organizationId);
      console.log("Cenários carregados:", dbScenarios);
      
      if (dbScenarios && dbScenarios.length > 0) {
        setScenarios(dbScenarios);
      } else {
        // Lista vazia se não houver cenários
        setScenarios([]);
      }
    } catch (error) {
      console.error("Erro ao carregar cenários:", error);
      setScenarios([]);
    }
  };

  const handleScenarioChange = async (value: string) => {
    setSelectedScenario(value);
    console.log("Mudando para cenário:", value);

    if (value === "base") {
      // Usar dados reais
      console.log("Cenário base selecionado - resetando para dados reais");
      onScenarioChange(null);
    } else if (value === "new") {
      // Abrir editor para novo cenário
      setEditingScenario(null);
      setShowEditor(true);
      // Resetar seleção
      setSelectedScenario("base");
    } else {
      // Carregar dados do cenário selecionado
      const scenario = scenarios.find((s) => s.id === value);
      console.log("Cenário encontrado:", scenario);
      if (scenario) {
        loadScenarioData(scenario);
      }
    }
  };

  const loadScenarioData = async (scenario: any) => {
    try {
      // Tentar carregar do banco primeiro
      if (
        scenario.id &&
        !scenario.id.startsWith("optimistic") &&
        !scenario.id.startsWith("pessimistic")
      ) {
        const fullScenario = await getScenarioById(scenario.id);
        if (fullScenario && fullScenario.harvest_data) {
          const adjustments: Record<string, any> = {};

          fullScenario.harvest_data.forEach((data: any) => {
            // Usar o ID da safra como chave, não o nome
            adjustments[data.harvest_id] = {
              dollarRate: parseFloat(data.dollar_rate) || 5.0,
              areaMultiplier: parseFloat(data.area_multiplier) || 1.0,
              costMultiplier: parseFloat(data.cost_multiplier) || 1.0,
              productivityMultiplier:
                parseFloat(data.productivity_multiplier) || 1.0,
            };
          });

          const scenarioData = {
            scenarioId: scenario.id,
            scenarioName: scenario.name,
            adjustments,
          };

          console.log("Enviando dados do cenário para o contexto:", scenarioData);
          onScenarioChange(scenarioData);
          return;
        }
      }
    } catch (error) {
      console.log("Erro ao carregar dados do cenário do banco:", error);
    }

    // Fallback para dados simulados
    const scenarioData = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      adjustments: {
        // Ajustes por safra
        "2024/25": {
          dollarRate: scenario.id === "optimistic" ? 6.0 : 4.5,
          costMultiplier: scenario.id === "optimistic" ? 1.05 : 0.95,
          productivityMultiplier: scenario.id === "optimistic" ? 1.1 : 0.9,
          areaMultiplier: 1.0,
        },
        "2025/26": {
          dollarRate: scenario.id === "optimistic" ? 6.2 : 4.3,
          costMultiplier: scenario.id === "optimistic" ? 1.08 : 0.92,
          productivityMultiplier: scenario.id === "optimistic" ? 1.15 : 0.85,
          areaMultiplier: scenario.id === "optimistic" ? 1.1 : 0.9,
        },
      },
    };

    onScenarioChange(scenarioData);
  };

  const handleEditScenario = () => {
    if (selectedScenario !== "base") {
      const scenario = scenarios.find((s) => s.id === selectedScenario);
      setEditingScenario(scenario);
      setShowEditor(true);
    }
  };

  const handleSaveScenario = async (scenarioData: any) => {
    try {
      if (editingScenario) {
        // Atualizar cenário existente
        const result = await updateScenario(editingScenario.id, {
          name: scenarioData.name,
          description: scenarioData.description,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        // Salvar dados das safras para cenário existente
        if (scenarioData.adjustments) {
          for (const [safraId, adjustments] of Object.entries(scenarioData.adjustments)) {
            try {
              const adj = adjustments as any;
              await saveHarvestScenarioData({
                scenario_id: editingScenario.id,
                harvest_id: safraId,
                dollar_rate: adj.dollarRate,
                area_multiplier: adj.areaMultiplier,
                cost_multiplier: adj.costMultiplier,
                productivity_multiplier: adj.productivityMultiplier,
              });
            } catch (error) {
              console.error("Erro ao salvar dados da safra:", error);
            }
          }
        }

        toast.success("Cenário atualizado com sucesso");
        await loadScenarios();
      } else {
        // Criar novo cenário
        const result = await createScenario({
          organization_id: organizationId,
          name: scenarioData.name,
          description: scenarioData.description,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        if (result.data) {
          // Salvar dados das safras para o novo cenário
          if (scenarioData.adjustments) {
            for (const [safraId, adjustments] of Object.entries(scenarioData.adjustments)) {
              try {
                const adj = adjustments as any;
                await saveHarvestScenarioData({
                  scenario_id: result.data.id,
                  harvest_id: safraId,
                  dollar_rate: adj.dollarRate,
                  area_multiplier: adj.areaMultiplier,
                  cost_multiplier: adj.costMultiplier,
                  productivity_multiplier: adj.productivityMultiplier,
                });
              } catch (error) {
                console.error("Erro ao salvar dados da safra:", error);
              }
            }
          }

          await loadScenarios();
          setSelectedScenario(result.data.id);
          toast.success("Cenário criado com sucesso");
        }
      }
      setShowEditor(false);
    } catch (error) {
      console.error("Erro ao salvar cenário:", error);
      toast.error("Erro ao salvar cenário");
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 px-6 py-2 border-b bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground">
          Cenário:
        </span>

        <Select value={selectedScenario} onValueChange={handleScenarioChange}>
          <SelectTrigger className="w-[250px] h-8">
            <SelectValue placeholder="Selecione um cenário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="base">
              <div className="flex items-center gap-2">
                <span>📊</span>
                <span>Cenário Base (Dados Reais)</span>
              </div>
            </SelectItem>

            {scenarios.length > 0 && <div className="border-t my-1" />}

            {scenarios.map((scenario) => (
              <SelectItem key={scenario.id} value={scenario.id}>
                <div className="flex items-center gap-2">
                  <span>📈</span>
                  <span>{scenario.name}</span>
                </div>
              </SelectItem>
            ))}

            <div className="border-t my-1" />

            <SelectItem value="new">
              <div className="flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" />
                <span>Criar Novo Cenário</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {selectedScenario !== "base" && selectedScenario !== "new" && (
          <Button variant="ghost" size="sm" onClick={handleEditScenario}>
            <Settings className="h-4 w-4" />
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingScenario(null);
              setShowEditor(true);
            }}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Nova Projeção
          </Button>
        </div>
      </div>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent 
          className="sm:max-w-[70%] max-w-6xl w-[90vw] max-h-[90vh] overflow-y-auto"
          style={{ minWidth: "900px" }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingScenario
                ? `Editar ${editingScenario.name}`
                : "Novo Cenário de Projeção"}
            </DialogTitle>
          </DialogHeader>
          <ScenarioEditorModal
            organizationId={organizationId}
            scenario={editingScenario}
            onSave={handleSaveScenario}
            onCancel={() => setShowEditor(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
