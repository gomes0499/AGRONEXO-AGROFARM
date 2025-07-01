"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTriggerPrimary } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Coins, Wheat } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getSafras } from "@/lib/actions/production-actions";
import { saveHarvestScenarioData, getHarvestScenarioData } from "@/lib/actions/scenario-actions";

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
  onCancel
}: ScenarioEditorModalProps) {
  const [loading, setLoading] = useState(true);
  const [safras, setSafras] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: scenario?.name || "",
    description: scenario?.description || "",
    adjustments: {} as Record<string, any>
  });

  useEffect(() => {
    loadSafras();
  }, [organizationId]);

  useEffect(() => {
    if (scenario?.id) {
      loadScenarioData();
    }
  }, [scenario]);

  const loadScenarioData = async () => {
    if (!scenario?.id) return;
    
    try {
      const harvestData = await getHarvestScenarioData(scenario.id);
      const adjustments: Record<string, any> = {};
      
      harvestData.forEach((data: any) => {
        adjustments[data.harvest_id] = {
          dollarRate: parseFloat(data.dollar_rate) || 5.0,
          areaMultiplier: parseFloat(data.area_multiplier) || 1.0,
          costMultiplier: parseFloat(data.cost_multiplier) || 1.0,
          productivityMultiplier: parseFloat(data.productivity_multiplier) || 1.0,
        };
      });
      
      setFormData(prev => ({
        ...prev,
        adjustments
      }));
    } catch (error) {
      console.error("Erro ao carregar dados do cenário:", error);
    }
  };

  const loadSafras = async () => {
    try {
      const safrasData = await getSafras(organizationId);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1; // 0-indexed
      
      // Filtrar apenas safras futuras ou em andamento
      const futureSafras = (safrasData || []).filter(safra => {
        // Extrair o ano inicial da safra (ex: "2024/25" -> 2024)
        const safraStartYear = parseInt(safra.nome.split('/')[0]);
        const safraEndYear = parseInt(safra.nome.split('/')[1]);
        
        // Se temos ano de fim, usar 2000 + safraEndYear para obter o ano completo
        const fullEndYear = safraEndYear < 50 ? 2000 + safraEndYear : 1900 + safraEndYear;
        
        // Safra é futura se começar após o ano atual
        if (safraStartYear > currentYear) return true;
        
        // Safra está em andamento se:
        // - Começou no ano atual ou anterior
        // - E termina no ano atual ou posterior
        if (safraStartYear <= currentYear && fullEndYear >= currentYear) {
          // Se estamos no ano de término, verificar se ainda não passou junho (fim típico da safra)
          if (fullEndYear === currentYear && currentMonth > 6) return false;
          return true;
        }
        
        return false;
      });
      
      // Ordenar safras do menor para o maior
      const sortedSafras = futureSafras.sort((a, b) => {
        const aYear = parseInt(a.nome.split('/')[0]);
        const bYear = parseInt(b.nome.split('/')[0]);
        return aYear - bYear;
      });
      
      setSafras(sortedSafras);

      // Inicializar ajustes para cada safra se não existirem
      const initialAdjustments: Record<string, any> = {};
      sortedSafras.forEach(safra => {
        if (!formData.adjustments[safra.id]) {
          initialAdjustments[safra.id] = {
            dollarRate: 5.0,
            areaMultiplier: 1.0,
            costMultiplier: 1.0,
            productivityMultiplier: 1.0,
          };
        }
      });

      if (Object.keys(initialAdjustments).length > 0) {
        setFormData(prev => ({
          ...prev,
          adjustments: { ...initialAdjustments, ...prev.adjustments }
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar safras:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustmentChange = (safraId: string, field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        [safraId]: {
          ...prev.adjustments[safraId],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return;
    }

    try {
      // Chamar onSave com os dados básicos e os ajustes
      await onSave(formData);
      
      // Nota: Os dados das safras devem ser salvos no componente pai após o cenário ser criado
      // pois precisamos do ID do cenário que é gerado após a criação
    } catch (error) {
      console.error("Erro ao salvar cenário:", error);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (safras.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          Não há safras futuras cadastradas para criar projeções.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Cadastre safras futuras no módulo de Produção para habilitar as projeções.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Cenário</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Cenário Dólar Alto 2025"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva as premissas deste cenário..."
            rows={2}
          />
        </div>
      </div>

      {/* Ajustes por Safra */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Ajustes por Safra</h3>
        
        <Tabs defaultValue={safras[0]?.id} className="w-full">
          <TabsList>
            {safras.map(safra => (
              <TabsTriggerPrimary 
                key={safra.id} 
                value={safra.id}
              >
                {safra.nome}
              </TabsTriggerPrimary>
            ))}
          </TabsList>

          {safras.map(safra => {
            const adjustments = formData.adjustments[safra.id] || {};
            
            return (
              <TabsContent key={safra.id} value={safra.id} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Taxa de Câmbio */}
                  <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Taxa de Câmbio (USD/BRL)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Dólar</Label>
                      <span className="text-base font-semibold">
                        {formatCurrency(adjustments.dollarRate || 5.0)}
                      </span>
                    </div>
                    <Slider
                      value={[adjustments.dollarRate || 5.0]}
                      onValueChange={([value]) => handleAdjustmentChange(safra.id, 'dollarRate', value)}
                      max={10}
                      min={3}
                      step={0.01}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>R$ 3,00</span>
                      <span>R$ 10,00</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Área Plantada */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Wheat className="h-4 w-4" />
                      Área Plantada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Multiplicador</Label>
                      <span className="text-base font-semibold">
                        {((adjustments.areaMultiplier || 1.0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={[adjustments.areaMultiplier || 1.0]}
                      onValueChange={([value]) => handleAdjustmentChange(safra.id, 'areaMultiplier', value)}
                      max={2}
                      min={0.5}
                      step={0.05}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>50%</span>
                      <span>100%</span>
                      <span>200%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Custo de Produção */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Custo de Produção
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Multiplicador</Label>
                      <span className="text-base font-semibold">
                        {((adjustments.costMultiplier || 1.0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={[adjustments.costMultiplier || 1.0]}
                      onValueChange={([value]) => handleAdjustmentChange(safra.id, 'costMultiplier', value)}
                      max={2}
                      min={0.5}
                      step={0.05}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>50%</span>
                      <span>100%</span>
                      <span>200%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Produtividade */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Produtividade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Multiplicador</Label>
                      <span className="text-base font-semibold">
                        {((adjustments.productivityMultiplier || 1.0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={[adjustments.productivityMultiplier || 1.0]}
                      onValueChange={([value]) => handleAdjustmentChange(safra.id, 'productivityMultiplier', value)}
                      max={1.5}
                      min={0.5}
                      step={0.05}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>50%</span>
                      <span>100%</span>
                      <span>150%</span>
                    </div>
                  </CardContent>
                </Card>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          {scenario ? 'Salvar Alterações' : 'Criar Cenário'}
        </Button>
      </div>
    </div>
  );
}