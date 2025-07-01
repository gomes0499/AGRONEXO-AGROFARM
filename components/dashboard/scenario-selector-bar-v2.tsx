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
import { ScenarioEditorModal } from "./scenario-editor-modal-v2";
import {
  getScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  saveHarvestDollarRate,
  saveCultureScenarioData,
  type CultureScenarioData,
} from "@/lib/actions/scenario-actions-v2";
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
      const dbScenarios = await getScenarios(organizationId);
      console.log("Cenários carregados:", dbScenarios);
      
      if (dbScenarios && dbScenarios.length > 0) {
        setScenarios(dbScenarios);
      } else {
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
      console.log("Cenário base selecionado - resetando para dados reais");
      onScenarioChange(null);
    } else if (value === "new") {
      setEditingScenario(null);
      setShowEditor(true);
      setSelectedScenario("base");
    } else {
      const scenario = scenarios.find((s) => s.id === value);
      console.log("Cenário encontrado:", scenario);
      if (scenario) {
        loadScenarioData(scenario);
      }
    }
  };

  const loadScenarioData = async (scenario: any) => {
    try {
      const fullScenario = await getScenarioById(scenario.id);
      if (fullScenario) {
        // Estrutura de dados para o contexto
        const scenarioData = {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          dollarRates: {} as Record<string, number>,
          cultureData: {} as Record<string, any[]>,
        };

        // Processar taxas de dólar
        fullScenario.harvest_data?.forEach((hd: any) => {
          scenarioData.dollarRates[hd.harvest_id] = hd.dollar_rate;
        });

        // Processar dados de cultura por safra
        fullScenario.culture_data?.forEach((cd: any) => {
          if (!scenarioData.cultureData[cd.harvest_id]) {
            scenarioData.cultureData[cd.harvest_id] = [];
          }
          
          scenarioData.cultureData[cd.harvest_id].push({
            culture_id: cd.culture_id,
            system_id: cd.system_id,
            culture_name: cd.culture?.nome,
            system_name: cd.system?.nome,
            area_hectares: cd.area_hectares,
            productivity: cd.productivity,
            productivity_unit: cd.productivity_unit,
            production_cost_per_hectare: cd.production_cost_per_hectare,
            price_per_unit: cd.price_per_unit,
          });
        });

        console.log("Enviando dados do cenário para o contexto:", scenarioData);
        onScenarioChange(scenarioData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do cenário:", error);
      toast.error("Erro ao carregar cenário");
    }
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
      let scenarioId: string;

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

        scenarioId = editingScenario.id;
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

        if (!result.data) {
          toast.error("Erro ao criar cenário");
          return;
        }

        scenarioId = result.data.id;
      }

      // Salvar taxas de dólar
      for (const [harvestId, dollarRate] of Object.entries(scenarioData.dollarRates)) {
        await saveHarvestDollarRate({
          scenario_id: scenarioId,
          harvest_id: harvestId,
          dollar_rate: dollarRate as number,
        });
      }

      // Salvar dados de cultura
      for (const [harvestId, cultures] of Object.entries(scenarioData.cultureData)) {
        for (const culture of cultures as CultureScenarioData[]) {
          if (culture.culture_id && culture.system_id) {
            await saveCultureScenarioData({
              ...culture,
              scenario_id: scenarioId,
              harvest_id: harvestId,
            });
          }
        }
      }

      toast.success(
        editingScenario 
          ? "Cenário atualizado com sucesso" 
          : "Cenário criado com sucesso"
      );
      
      await loadScenarios();
      setSelectedScenario(scenarioId);
      loadScenarioData({ id: scenarioId, name: scenarioData.name });
      setShowEditor(false);
    } catch (error) {
      console.error("Erro ao salvar cenário:", error);
      toast.error("Erro ao salvar cenário");
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 px-6 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingScenario(null);
              setShowEditor(true);
            }}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Cenário
          </Button>

          {selectedScenario !== "base" && selectedScenario !== "new" && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleEditScenario}
              className="h-8"
              title="Editar cenário atual"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          {selectedScenario !== "base" && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Projeção ativa</span>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent 
          className="sm:max-w-[80%] max-w-7xl w-[90vw] max-h-[90vh] overflow-y-auto"
          style={{ minWidth: "1000px" }}
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