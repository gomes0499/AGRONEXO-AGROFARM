"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSafras } from "@/lib/actions/production-actions";
import { saveHarvestScenarioData, getHarvestScenarioData } from "@/lib/actions/scenario-actions";
import { createClient } from "@/lib/supabase/client";

interface ScenarioEditorModalProps {
  organizationId: string;
  scenario?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

interface CommodityPrice {
  id: string;
  commodity_type: string;
  unit: string;
  current_price: number;
  precos_por_ano: Record<string, number>;
}

interface ExchangeRate {
  id: string;
  tipo_moeda: string;
  unit: string;
  cotacao_atual: number;
  cotacoes_por_ano: Record<string, number>;
}

interface PlantingArea {
  id: string;
  cultura_id: string;
  sistema_id: string;
  areas_por_safra?: Record<string, number>;
}

interface Productivity {
  id: string;
  cultura_id: string;
  sistema_id: string;
  produtividades_por_safra?: Record<string, number>;
  unidade: string;
}

interface ProductionCost {
  id: string;
  cultura_id: string;
  sistema_id: string;
  categoria: string;
  custos_por_safra?: Record<string, number>;
}

interface Culture {
  id: string;
  nome: string;
}

interface System {
  id: string;
  nome: string;
}

interface Safra {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
}

export function ScenarioEditorModal({
  organizationId,
  scenario,
  onSave,
  onCancel
}: ScenarioEditorModalProps) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [safras, setSafras] = useState<Safra[]>([]);
  const [formData, setFormData] = useState({
    name: scenario?.name || "",
    description: scenario?.description || "",
    adjustments: {} as Record<string, any>
  });
  
  // States from production module
  const [prices, setPrices] = useState<CommodityPrice[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [plantingAreas, setPlantingAreas] = useState<PlantingArea[]>([]);
  const [productivities, setProductivities] = useState<Productivity[]>([]);
  const [productionCosts, setProductionCosts] = useState<ProductionCost[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (organizationId) {
      loadData();
    }
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

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Buscar safras
      const { data: safrasData, error: safrasError } = await supabase
        .from("safras")
        .select("*")
        .eq("organizacao_id", organizationId)
        .order("ano_inicio", { ascending: true });

      if (safrasError) throw safrasError;

      // Filtrar safras até 2029/30
      const filteredSafras = safrasData.filter((s) => s.ano_inicio <= 2029);
      setSafras(filteredSafras);

      // Buscar culturas
      const { data: culturesData } = await supabase
        .from("culturas")
        .select("*")
        .eq("organizacao_id", organizationId)
        .order("nome");

      if (culturesData) setCultures(culturesData);

      // Buscar sistemas
      const { data: systemsData } = await supabase
        .from("sistemas")
        .select("*")
        .eq("organizacao_id", organizationId)
        .order("nome");

      if (systemsData) setSystems(systemsData);

      // Buscar preços base
      const { data: pricesData, error: pricesError } = await supabase
        .from("commodity_price_projections")
        .select("*")
        .eq("organizacao_id", organizationId)
        .is("projection_id", null)
        .order("commodity_type");

      if (pricesError) console.error("Erro ao buscar preços:", pricesError);
      if (pricesData) setPrices(pricesData);

      // Buscar cotações base usando a função RPC unificada
      const { data: exchangeData, error: exchangeError } = await supabase
        .rpc('get_exchange_rates_unified', {
          p_organizacao_id: organizationId,
          p_id: null
        });

      
      if (exchangeError) {
        console.error("Erro ao buscar cotações:", exchangeError);
        
        // Fallback para busca direta se RPC falhar
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("cotacoes_cambio")
          .select("*")
          .eq("organizacao_id", organizationId)
          .is("projection_id", null)
          .order("tipo_moeda");
          
        
        if (!fallbackError && fallbackData && fallbackData.length > 0) {
          const uniqueRates = fallbackData.reduce((acc: ExchangeRate[], rate) => {
            if (!acc.find(r => r.tipo_moeda === rate.tipo_moeda)) {
              acc.push(rate);
            }
            return acc;
          }, []);
          
          setExchangeRates(uniqueRates);
        }
      } else if (exchangeData && exchangeData.length > 0) {
        // Agregar cotações por tipo de moeda (pegar apenas uma de cada tipo)
        const uniqueRates = exchangeData.reduce((acc: ExchangeRate[], rate: any) => {
          if (!acc.find(r => r.tipo_moeda === rate.tipo_moeda)) {
            acc.push({
              id: rate.id,
              tipo_moeda: rate.tipo_moeda,
              unit: rate.unit || 'R$',
              cotacao_atual: rate.cotacao_atual,
              cotacoes_por_ano: rate.cotacoes_por_ano
            });
          }
          return acc;
        }, []);
        
        setExchangeRates(uniqueRates);
      } else {
      }

      // Buscar áreas base
      const { data: areasData } = await supabase
        .from("areas_plantio")
        .select("*")
        .eq("organizacao_id", organizationId);

      if (areasData) setPlantingAreas(areasData);

      // Buscar produtividades base
      const { data: productivityData } = await supabase
        .from("produtividades")
        .select("*")
        .eq("organizacao_id", organizationId);

      if (productivityData) setProductivities(productivityData);

      // Buscar custos base
      const { data: costsData } = await supabase
        .from("custos_producao")
        .select("*")
        .eq("organizacao_id", organizationId);

      if (costsData) setProductionCosts(costsData);

      // Definir item selecionado inicial
      if (pricesData && pricesData.length > 0) {
        setSelectedItem(`commodity_${pricesData[0].commodity_type}`);
      } else if (exchangeData && exchangeData.length > 0) {
        setSelectedItem(`exchange_${exchangeData[0].tipo_moeda}`);
      }

      setHasChanges(false);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (safraId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setEditedValues(prev => ({
      ...prev,
      [safraId]: numValue
    }));
    
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      
      // Converter os valores editados para o formato de ajustes esperado
      const adjustments: Record<string, any> = {};
      
      // Para cada safra, criar um objeto de ajustes
      safras.forEach(safra => {
        // Pegar o valor editado para a safra atual
        const editedValue = editedValues[safra.id];
        
        // Se temos um item selecionado e um valor editado
        if (selectedItem && editedValue !== undefined) {
          const [type] = selectedItem.split('_');
          
          // Criar ajustes baseados no tipo de item
          if (!adjustments[safra.id]) {
            adjustments[safra.id] = {
              dollarRate: 5.0,
              areaMultiplier: 1.0,
              costMultiplier: 1.0,
              productivityMultiplier: 1.0,
            };
          }
          
          // Se é taxa de câmbio, usar o valor diretamente
          if (type === 'exchange') {
            adjustments[safra.id].dollarRate = editedValue;
          }
        }
      });
      
      // Preparar dados para salvar
      const scenarioData = {
        name: formData.name,
        description: formData.description,
        adjustments
      };
      
      await onSave(scenarioData);
    } catch (error) {
      console.error("Erro ao salvar cenário:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Carregar valores do item selecionado
  useEffect(() => {
    if (!selectedItem) return;

    const [type, ...itemKeyParts] = selectedItem.split('_');
    const itemKey = itemKeyParts.join('_');
    
    if (type === 'commodity') {
      const price = prices.find(p => p.commodity_type === itemKey);
      if (price) {
        setEditedValues({ ...price.precos_por_ano });
      }
    } else if (type === 'exchange') {
      const rate = exchangeRates.find(r => r.tipo_moeda === itemKey);
      if (rate) {
        setEditedValues({ ...rate.cotacoes_por_ano });
      }
    } else if (type === 'area') {
      const values: Record<string, number> = {};
      const [culturaId, sistemaId] = itemKey.split('|');
      const filteredAreas = plantingAreas.filter(a => a.cultura_id === culturaId && a.sistema_id === sistemaId);
      
      if (filteredAreas.length > 0 && filteredAreas[0].areas_por_safra) {
        Object.assign(values, filteredAreas[0].areas_por_safra);
      }
      
      setEditedValues(values);
    } else if (type === 'productivity') {
      const values: Record<string, number> = {};
      const [culturaId, sistemaId] = itemKey.split('|');
      const filteredProds = productivities.filter(p => p.cultura_id === culturaId && p.sistema_id === sistemaId);
      
      if (filteredProds.length > 0 && filteredProds[0].produtividades_por_safra) {
        Object.assign(values, filteredProds[0].produtividades_por_safra);
      }
      
      setEditedValues(values);
    } else if (type === 'cost') {
      const values: Record<string, number> = {};
      const [culturaId, sistemaId, categoria] = itemKey.split('|');
      const filteredCosts = productionCosts.filter(c => 
        c.cultura_id === culturaId && 
        c.sistema_id === sistemaId && 
        c.categoria === categoria
      );
      
      if (filteredCosts.length > 0 && filteredCosts[0].custos_por_safra) {
        Object.assign(values, filteredCosts[0].custos_por_safra);
      }
      
      setEditedValues(values);
    }
  }, [selectedItem, prices, exchangeRates, plantingAreas, productivities, productionCosts]);

  // Helper functions
  const formatCommodityName = (type: string) => {
    const names: Record<string, string> = {
      'SOJA': 'Soja',
      'SOJA_IRRIGADO': 'Soja Irrigado',
      'MILHO': 'Milho',
      'MILHO_SAFRINHA': 'Milho Safrinha',
      'ALGODAO': 'Algodão',
      'ARROZ': 'Arroz',
      'SORGO': 'Sorgo',
      'FEIJAO': 'Feijão',
    };
    return names[type] || type;
  };

  const formatExchangeName = (type: string) => {
    const names: Record<string, string> = {
      'DOLAR_ALGODAO': 'Dólar Algodão',
      'DOLAR_SOJA': 'Dólar Soja',
      'DOLAR_MILHO': 'Dólar Milho',
      'DOLAR_FECHAMENTO': 'Dólar Fechamento',
    };
    return names[type] || type;
  };

  const getCostCategoryName = (category: string) => {
    const names: Record<string, string> = {
      'CALCARIO': 'Calcário',
      'FERTILIZANTE': 'Fertilizante',
      'SEMENTES': 'Sementes',
      'TRATAMENTO_SEMENTES': 'Tratamento de Sementes',
      'HERBICIDA': 'Herbicida',
      'INSETICIDA': 'Inseticida',
      'FUNGICIDA': 'Fungicida',
      'OUTROS': 'Outros',
      'BENEFICIAMENTO': 'Beneficiamento',
      'SERVICOS': 'Serviços',
      'ADMINISTRATIVO': 'Administrativo',
    };
    return names[category] || category;
  };

  const getItemUnit = () => {
    const [type, ...itemKeyParts] = selectedItem.split('_');
    const itemKey = itemKeyParts.join('_');
    
    if (type === 'commodity') {
      const item = prices.find(p => p.commodity_type === itemKey);
      return item?.unit || '';
    } else if (type === 'exchange') {
      const item = exchangeRates.find(r => r.tipo_moeda === itemKey);
      return item?.unit || '';
    } else if (type === 'area') {
      return 'ha';
    } else if (type === 'productivity') {
      const [culturaId] = itemKey.split('|');
      const cultura = cultures.find(c => c.id === culturaId);
      return cultura?.nome?.includes('ALGODÃO') ? '@/ha' : 'sc/ha';
    } else if (type === 'cost') {
      return 'R$/ha';
    }
    
    return '';
  };

  const getItemTitle = () => {
    const [type, ...itemKeyParts] = selectedItem.split('_');
    const itemKey = itemKeyParts.join('_');
    
    if (type === 'commodity') {
      return formatCommodityName(itemKey);
    } else if (type === 'exchange') {
      return formatExchangeName(itemKey);
    } else if (type === 'area' || type === 'productivity' || type === 'cost') {
      const [culturaId, sistemaId, categoria] = itemKey.split('|');
      const cultura = cultures.find(c => c.id === culturaId);
      const sistema = systems.find(s => s.id === sistemaId);
      
      let title = `${cultura?.nome || ''} ${sistema?.nome || ''}`;
      
      if (type === 'cost' && categoria) {
        title += ` - ${getCostCategoryName(categoria)}`;
      }
      
      return title;
    }
    
    return '';
  };

  // Agrupar itens
  const getAreaItems = () => {
    const items: Array<{ key: string; display: string }> = [];
    const processed = new Set<string>();
    
    plantingAreas.forEach(area => {
      const key = `${area.cultura_id}|${area.sistema_id}`;
      if (!processed.has(key)) {
        processed.add(key);
        const cultura = cultures.find(c => c.id === area.cultura_id);
        const sistema = systems.find(s => s.id === area.sistema_id);
        items.push({
          key: `area_${key}`,
          display: `${cultura?.nome || ''} ${sistema?.nome || ''} (ha)`
        });
      }
    });
    
    return items;
  };

  const getProductivityItems = () => {
    const items: Array<{ key: string; display: string }> = [];
    const processed = new Set<string>();
    
    productivities.forEach(prod => {
      const key = `${prod.cultura_id}|${prod.sistema_id}`;
      if (!processed.has(key)) {
        processed.add(key);
        const cultura = cultures.find(c => c.id === prod.cultura_id);
        const sistema = systems.find(s => s.id === prod.sistema_id);
        const unit = cultura?.nome?.includes('ALGODÃO') ? '@/ha' : 'sc/ha';
        items.push({
          key: `productivity_${key}`,
          display: `${cultura?.nome || ''} ${sistema?.nome || ''} (${unit})`
        });
      }
    });
    
    return items;
  };

  const getCostItems = () => {
    const items: Array<{ key: string; display: string }> = [];
    const processed = new Set<string>();
    
    productionCosts.forEach(cost => {
      const key = `${cost.cultura_id}|${cost.sistema_id}|${cost.categoria}`;
      if (!processed.has(key)) {
        processed.add(key);
        const cultura = cultures.find(c => c.id === cost.cultura_id);
        const sistema = systems.find(s => s.id === cost.sistema_id);
        items.push({
          key: `cost_${key}`,
          display: `${cultura?.nome || ''} ${sistema?.nome || ''} - ${getCostCategoryName(cost.categoria)} (R$/ha)`
        });
      }
    });
    
    return items;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (safras.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          Não há safras cadastradas para criar cenários.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Cadastre safras no módulo de Produção para habilitar os cenários.
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
            placeholder="Ex: Cenário Otimista 2025"
            disabled={loading || isSaving}
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
            disabled={loading || isSaving}
          />
        </div>
      </div>

      {/* Seletor de Item */}
      <div className="space-y-2">
        <Label>Selecione o item para editar</Label>
        <Select value={selectedItem} onValueChange={setSelectedItem}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um item" />
          </SelectTrigger>
          <SelectContent>
            {/* Preços de Commodities */}
            {prices.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  Preços de Commodities
                </div>
                {prices.map((price) => (
                  <SelectItem key={price.id} value={`commodity_${price.commodity_type}`}>
                    {formatCommodityName(price.commodity_type)} ({price.unit})
                  </SelectItem>
                ))}
              </>
            )}
            
            {/* Câmbios */}
            {exchangeRates.length > 0 && (
              <>
                {prices.length > 0 && <div className="h-px bg-border my-1" />}
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  Taxas de Câmbio
                </div>
                {exchangeRates.map((rate) => (
                  <SelectItem key={rate.id} value={`exchange_${rate.tipo_moeda}`}>
                    {formatExchangeName(rate.tipo_moeda)} ({rate.unit})
                  </SelectItem>
                ))}
              </>
            )}
            
            {/* Áreas de Plantio */}
            {plantingAreas.length > 0 && (
              <>
                <div className="h-px bg-border my-1" />
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  Áreas de Plantio
                </div>
                {getAreaItems().map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.display}
                  </SelectItem>
                ))}
              </>
            )}
            
            {/* Produtividade */}
            {productivities.length > 0 && (
              <>
                <div className="h-px bg-border my-1" />
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  Produtividade
                </div>
                {getProductivityItems().map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.display}
                  </SelectItem>
                ))}
              </>
            )}
            
            {/* Custos de Produção */}
            {productionCosts.length > 0 && (
              <>
                <div className="h-px bg-border my-1" />
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  Custos de Produção
                </div>
                {getCostItems().map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.display}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de valores */}
      {selectedItem && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg">
              {getItemTitle()}
            </h3>
            <Badge variant="secondary">{getItemUnit()}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {safras.map((safra) => {
              const currentValue = editedValues[safra.id] || 0;

              return (
                <div key={safra.id} className="space-y-2">
                  <Label
                    htmlFor={`value-${safra.id}`}
                    className="text-sm"
                  >
                    {safra.nome}
                  </Label>
                  <Input
                    id={`value-${safra.id}`}
                    type="number"
                    step={selectedItem.startsWith('exchange_') ? "0.0001" : "0.01"}
                    value={currentValue}
                    onChange={(e) => handleValueChange(safra.id, e.target.value)}
                    className="h-9"
                    disabled={loading || isSaving}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSaving || !formData.name.trim()}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            scenario ? 'Salvar Alterações' : 'Criar Cenário'
          )}
        </Button>
      </div>
    </div>
  );
}