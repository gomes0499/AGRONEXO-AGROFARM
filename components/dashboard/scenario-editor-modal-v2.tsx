"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, DollarSign, Leaf, Calculator, TrendingUp, RefreshCw } from "lucide-react";
import { getSafras, getCultures, getSistemas } from "@/lib/actions/production-actions";
import {
  getCurrentProductionData,
  getCurrentExchangeRates,
  type CultureScenarioData,
} from "@/lib/actions/scenario-actions-v2";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface SafraData {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
}

interface CultureData {
  id: string;
  nome: string;
}

interface SystemData {
  id: string;
  nome: string;
}

interface ScenarioEditorModalProps {
  organizationId: string;
  scenario?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function ScenarioEditorModal({
  organizationId,
  scenario,
  onSave,
  onCancel,
}: ScenarioEditorModalProps) {
  const [name, setName] = useState(scenario?.name || "");
  const [description, setDescription] = useState(scenario?.description || "");
  const [safras, setSafras] = useState<SafraData[]>([]);
  const [cultures, setCultures] = useState<CultureData[]>([]);
  const [systems, setSystems] = useState<SystemData[]>([]);
  const [selectedSafra, setSelectedSafra] = useState<string>("");
  const [dollarRates, setDollarRates] = useState<Record<string, {algodao: number, fechamento: number, soja: number}>>({});
  const [cultureData, setCultureData] = useState<Record<string, CultureScenarioData[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [organizationId]);
  
  // Carregar câmbios do módulo de produção para cada safra
  const loadExchangeRatesForSafra = async (safraId: string) => {
    const rates = await getCurrentExchangeRates(organizationId, safraId);
    if (rates) {
      setDollarRates(prev => ({
        ...prev,
        [safraId]: rates
      }));
      return true;
    }
    return false;
  };

  const loadData = async () => {
    try {
      const [safrasData, culturesData, systemsData] = await Promise.all([
        getSafras(organizationId),
        getCultures(organizationId),
        getSistemas(organizationId),
      ]);

      setSafras(safrasData || []);
      setCultures(culturesData || []);
      setSystems(systemsData || []);

      // Filtrar apenas safras futuras
      const currentYear = new Date().getFullYear();
      const futureSafras = safrasData?.filter(s => s.ano_inicio >= currentYear) || [];
      
      if (futureSafras.length > 0 && !selectedSafra) {
        setSelectedSafra(futureSafras[0].id);
      }

      // Se editando, carregar dados existentes
      if (scenario) {
        // Carregar taxas de dólar
        const rates: Record<string, {algodao: number, fechamento: number, soja: number}> = {};
        scenario.harvest_data?.forEach((hd: any) => {
          rates[hd.harvest_id] = {
            algodao: hd.dollar_rate_algodao || 0,
            fechamento: hd.dollar_rate_fechamento || 0,
            soja: hd.dollar_rate_soja || 0
          };
        });
        setDollarRates(rates);

        // Carregar dados de cultura
        const cultures: Record<string, CultureScenarioData[]> = {};
        scenario.culture_data?.forEach((cd: any) => {
          if (!cultures[cd.harvest_id]) {
            cultures[cd.harvest_id] = [];
          }
          cultures[cd.harvest_id].push(cd);
        });
        setCultureData(cultures);
      } else {
        // Se não está editando, carregar câmbios atuais do módulo de produção para TODAS as safras
        for (const safra of safrasData || []) {
          const rates = await getCurrentExchangeRates(organizationId, safra.id);
          if (rates) {
            setDollarRates(prev => ({
              ...prev,
              [safra.id]: rates
            }));
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleAddCulture = (safraId: string) => {
    const newCulture: CultureScenarioData = {
      scenario_id: scenario?.id || "",
      harvest_id: safraId,
      culture_id: "",
      system_id: "",
      area_hectares: 0,
      productivity: 0,
      productivity_unit: "sc/ha",
      production_cost_per_hectare: 0,
    };

    setCultureData(prev => ({
      ...prev,
      [safraId]: [...(prev[safraId] || []), newCulture],
    }));
  };

  const handleRemoveCulture = (safraId: string, index: number) => {
    setCultureData(prev => ({
      ...prev,
      [safraId]: prev[safraId].filter((_, i) => i !== index),
    }));
  };

  const handleCultureChange = (
    safraId: string,
    index: number,
    field: keyof CultureScenarioData,
    value: any
  ) => {
    setCultureData(prev => ({
      ...prev,
      [safraId]: prev[safraId].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const loadCurrentData = async (safraId: string, index: number) => {
    const culture = cultureData[safraId][index];
    if (!culture.culture_id || !culture.system_id) return;

    setLoading(true);
    try {
      const currentData = await getCurrentProductionData(
        organizationId,
        safraId,
        culture.culture_id,
        culture.system_id
      );

      handleCultureChange(safraId, index, "area_hectares", currentData.area_hectares);
      handleCultureChange(safraId, index, "productivity", currentData.productivity);
      handleCultureChange(safraId, index, "productivity_unit", currentData.productivity_unit);
      handleCultureChange(safraId, index, "production_cost_per_hectare", currentData.production_cost_per_hectare);
    } catch (error) {
      console.error("Erro ao carregar dados atuais:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // Validar nome antes de salvar
    if (!name || name.trim().length === 0) {
      toast.error("O nome do cenário é obrigatório");
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim(),
      dollarRates,
      cultureData,
    };

    onSave(data);
  };

  // Filtrar apenas safras projetáveis (futuras)
  const projectableSafras = safras.filter(safra => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Se estamos no meio do ano (após junho), incluir safra do ano atual
    if (currentMonth > 6) {
      return safra.ano_inicio >= currentYear;
    } else {
      // Se estamos no início do ano, incluir apenas safras futuras
      return safra.ano_inicio > currentYear;
    }
  });

  return (
    <div className="space-y-4">
      {/* Informações básicas */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Cenário</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Cenário Otimista 2025"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva as premissas deste cenário..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      {/* Tabs por safra */}
      <Tabs value={selectedSafra} onValueChange={setSelectedSafra} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {projectableSafras.slice(0, 3).map((safra) => (
            <TabsTrigger key={safra.id} value={safra.id}>
              {safra.nome}
            </TabsTrigger>
          ))}
        </TabsList>

        {projectableSafras.map((safra) => (
          <TabsContent key={safra.id} value={safra.id} className="space-y-4">
            {/* Taxa de Dólar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Taxa de Câmbio
                  </div>
                  {!scenario && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const loaded = await loadExchangeRatesForSafra(safra.id);
                        if (loaded) {
                          toast.success("Câmbios carregados com sucesso");
                        } else {
                          toast.error("Erro ao carregar câmbios");
                        }
                      }}
                    >
                      Carregar Dados Atuais
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor={`dollar-algodao-${safra.id}`} className="min-w-[150px]">
                    Dólar Algodão (R$)
                  </Label>
                  <Input
                    id={`dollar-algodao-${safra.id}`}
                    type="number"
                    step="0.01"
                    value={dollarRates[safra.id]?.algodao || ""}
                    onChange={(e) =>
                      setDollarRates(prev => ({
                        ...prev,
                        [safra.id]: {
                          ...prev[safra.id],
                          algodao: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    placeholder="5.45"
                    className="max-w-[150px]"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label htmlFor={`dollar-fechamento-${safra.id}`} className="min-w-[150px]">
                    Dólar Fechamento (R$)
                  </Label>
                  <Input
                    id={`dollar-fechamento-${safra.id}`}
                    type="number"
                    step="0.01"
                    value={dollarRates[safra.id]?.fechamento || ""}
                    onChange={(e) =>
                      setDollarRates(prev => ({
                        ...prev,
                        [safra.id]: {
                          ...prev[safra.id],
                          fechamento: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    placeholder="5.70"
                    className="max-w-[150px]"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label htmlFor={`dollar-soja-${safra.id}`} className="min-w-[150px]">
                    Dólar Soja (R$)
                  </Label>
                  <Input
                    id={`dollar-soja-${safra.id}`}
                    type="number"
                    step="0.01"
                    value={dollarRates[safra.id]?.soja || ""}
                    onChange={(e) =>
                      setDollarRates(prev => ({
                        ...prev,
                        [safra.id]: {
                          ...prev[safra.id],
                          soja: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    placeholder="5.20"
                    className="max-w-[150px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Culturas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-4 w-4" />
                    Projeções por Cultura
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddCulture(safra.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cultura
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(cultureData[safra.id] || []).map((culture, index) => (
                  <Card key={index} className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Seleção de Cultura e Sistema */}
                        <div>
                          <Label>Cultura</Label>
                          <Select
                            value={culture.culture_id}
                            onValueChange={(value) => {
                              handleCultureChange(safra.id, index, "culture_id", value);
                              if (culture.system_id) {
                                loadCurrentData(safra.id, index);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a cultura" />
                            </SelectTrigger>
                            <SelectContent>
                              {cultures.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Sistema</Label>
                          <Select
                            value={culture.system_id}
                            onValueChange={(value) => {
                              handleCultureChange(safra.id, index, "system_id", value);
                              if (culture.culture_id) {
                                loadCurrentData(safra.id, index);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o sistema" />
                            </SelectTrigger>
                            <SelectContent>
                              {systems.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Valores */}
                        <div>
                          <Label>Área (hectares)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={culture.area_hectares}
                            onChange={(e) =>
                              handleCultureChange(
                                safra.id,
                                index,
                                "area_hectares",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <Label>Produtividade ({culture.productivity_unit})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={culture.productivity}
                            onChange={(e) =>
                              handleCultureChange(
                                safra.id,
                                index,
                                "productivity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <Label>Custo de Produção (R$/ha)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={culture.production_cost_per_hectare}
                            onChange={(e) =>
                              handleCultureChange(
                                safra.id,
                                index,
                                "production_cost_per_hectare",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCulture(safra.id, index)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Resumo */}
                      {culture.culture_id && culture.area_hectares > 0 && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Produção Total:</span>
                              <p className="font-medium">
                                {(culture.area_hectares * culture.productivity).toFixed(2)}{" "}
                                {culture.productivity_unit.replace("/ha", "")}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Custo Total:</span>
                              <p className="font-medium">
                                {formatCurrency(
                                  culture.area_hectares * culture.production_cost_per_hectare
                                )}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Custo/Unidade:</span>
                              <p className="font-medium">
                                {culture.productivity > 0
                                  ? formatCurrency(
                                      culture.production_cost_per_hectare / culture.productivity
                                    )
                                  : "R$ 0,00"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {(!cultureData[safra.id] || cultureData[safra.id].length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma cultura adicionada para esta safra.
                    <br />
                    Clique em "Adicionar Cultura" para começar.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Botões de ação */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={!name || loading}>
          {scenario ? "Atualizar" : "Criar"} Cenário
        </Button>
      </div>
    </div>
  );
}