"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface PriceEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectionId: string;
  projectionName: string;
  organizationId: string;
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
  ciclo_id: string;
  area?: number;
  safra_id?: string;
  // Estrutura com valores por safra
  areas_por_safra?: Record<string, number>;
}

interface Productivity {
  id: string;
  cultura_id: string;
  sistema_id: string;
  produtividade?: number;
  unidade: string;
  safra_id?: string;
  // Estrutura com valores por safra
  produtividades_por_safra?: Record<string, number>;
}

interface ProductionCost {
  id: string;
  cultura_id: string;
  sistema_id: string;
  categoria: string;
  valor?: number;
  safra_id?: string;
  // Estrutura com custos por safra
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

export function PriceEditorModal({
  open,
  onOpenChange,
  projectionId,
  projectionName,
  organizationId,
}: PriceEditorModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [prices, setPrices] = useState<CommodityPrice[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [plantingAreas, setPlantingAreas] = useState<PlantingArea[]>([]);
  const [productivities, setProductivities] = useState<Productivity[]>([]);
  const [productionCosts, setProductionCosts] = useState<ProductionCost[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [safras, setSafras] = useState<Safra[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar dados
  useEffect(() => {
    if (open && projectionId) {
      loadData();
    }
  }, [open, projectionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
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

      // Buscar preços das commodities
      const { data: pricesData, error: pricesError } = await supabase
        .from("commodity_price_projections")
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("projection_id", projectionId)
        .order("commodity_type", { ascending: true });

      if (pricesError) throw pricesError;
      setPrices(pricesData || []);

      // Buscar cotações de câmbio usando a função RPC unificada
      const { data: exchangeData, error: exchangeError } = await supabase
        .rpc('get_exchange_rates_unified', {
          p_organizacao_id: organizationId,
          p_id: projectionId
        });

      if (!exchangeError && exchangeData && exchangeData.length > 0) {
        // Agregar por tipo de moeda se necessário
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
        console.log("Cotações de câmbio carregadas:", uniqueRates);
      } else {
        console.log("Nenhuma cotação de câmbio encontrada ou erro:", exchangeError);
      }

      // Buscar áreas de plantio
      const { data: areasData } = await supabase
        .from("areas_plantio_projections")
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("projection_id", projectionId);

      if (areasData) setPlantingAreas(areasData);

      // Buscar produtividades
      const { data: productivityData } = await supabase
        .from("produtividades_projections")
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("projection_id", projectionId);

      if (productivityData) setProductivities(productivityData);

      // Buscar custos de produção
      const { data: costsData } = await supabase
        .from("custos_producao_projections")
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("projection_id", projectionId);

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
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
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
        // Converter cotações por ano para valores por safra
        const valuesBySafra: Record<string, number> = {};
        safras.forEach(safra => {
          const yearKey = safra.ano_inicio.toString();
          valuesBySafra[safra.id] = rate.cotacoes_por_ano[yearKey] || 0;
        });
        setEditedValues(valuesBySafra);
      }
    } else if (type === 'area') {
      // Para áreas, verificar se tem estrutura por ano ou por safra
      const values: Record<string, number> = {};
      const [culturaId, sistemaId] = itemKey.split('|');
      
      
      const filteredAreas = plantingAreas.filter(a => a.cultura_id === culturaId && a.sistema_id === sistemaId);
      
      if (filteredAreas.length > 0) {
        const firstArea = filteredAreas[0];
        
        // Verificar se tem estrutura areas_por_safra
        if (firstArea.areas_por_safra) {
          Object.assign(values, firstArea.areas_por_safra);
        } else {
          // Estrutura com safra_id individual
          filteredAreas.forEach(area => {
            if (area.safra_id) {
              values[area.safra_id] = area.area || 0;
            }
          });
        }
      }
      
      setEditedValues(values);
    } else if (type === 'productivity') {
      // Para produtividade, verificar estrutura
      const values: Record<string, number> = {};
      const [culturaId, sistemaId] = itemKey.split('|');
      
      
      const filteredProds = productivities.filter(p => p.cultura_id === culturaId && p.sistema_id === sistemaId);
      
      if (filteredProds.length > 0) {
        const firstProd = filteredProds[0];
        
        // Verificar se tem estrutura produtividades_por_safra
        if (firstProd.produtividades_por_safra) {
          Object.assign(values, firstProd.produtividades_por_safra);
        } else {
          // Estrutura com safra_id individual
          filteredProds.forEach(prod => {
            if (prod.safra_id) {
              values[prod.safra_id] = prod.produtividade || 0;
            }
          });
        }
      }
      
      setEditedValues(values);
    } else if (type === 'cost') {
      // Para custos, verificar estrutura
      const values: Record<string, number> = {};
      const [culturaId, sistemaId, categoria] = itemKey.split('|');
      
      
      const filteredCosts = productionCosts.filter(c => 
        c.cultura_id === culturaId && 
        c.sistema_id === sistemaId && 
        c.categoria === categoria
      );
      
      if (filteredCosts.length > 0) {
        const firstCost = filteredCosts[0];
        
        // Verificar se tem estrutura custos_por_safra
        if (firstCost.custos_por_safra) {
          Object.assign(values, firstCost.custos_por_safra);
        } else {
          // Estrutura com safra_id individual
          filteredCosts.forEach(cost => {
            if (cost.safra_id) {
              values[cost.safra_id] = cost.valor || 0;
            }
          });
        }
      }
      
      
      setEditedValues(values);
    }
  }, [selectedItem, prices, exchangeRates, plantingAreas, productivities, productionCosts]);

  const handleValueChange = (safraId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setEditedValues(prev => ({
      ...prev,
      [safraId]: numValue
    }));
    
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const supabase = createClient();

      const [type, ...itemKeyParts] = selectedItem.split('_');
      const itemKey = itemKeyParts.join('_');

      if (type === 'commodity') {
        const price = prices.find(p => p.commodity_type === itemKey);
        if (price) {
          const { error } = await supabase
            .from("commodity_price_projections")
            .update({
              precos_por_ano: editedValues,
              updated_at: new Date().toISOString(),
            })
            .eq("id", price.id);

          if (error) throw error;
        }
      } else if (type === 'exchange') {
        const rate = exchangeRates.find(r => r.tipo_moeda === itemKey);
        if (rate) {
          // Converter valores por safra de volta para valores por ano
          const cotacoesPorAno: Record<string, number> = {};
          Object.entries(editedValues).forEach(([safraId, value]) => {
            const safra = safras.find(s => s.id === safraId);
            if (safra) {
              const yearKey = safra.ano_inicio.toString();
              cotacoesPorAno[yearKey] = value;
            }
          });

          // Usar a função RPC para atualizar cotações
          const { error } = await supabase
            .rpc('update_exchange_rate_unified', {
              p_id: rate.id,
              p_tipo_moeda: rate.tipo_moeda,
              p_cotacao_atual: rate.cotacao_atual,
              p_cotacoes_por_ano: JSON.stringify(cotacoesPorAno)
            });

          if (error) throw error;
        }
      } else if (type === 'area') {
        const [culturaId, sistemaId] = itemKey.split('|');
        const filteredAreas = plantingAreas.filter(a => a.cultura_id === culturaId && a.sistema_id === sistemaId);
        
        if (filteredAreas.length > 0) {
          const firstArea = filteredAreas[0];
          
          // Verificar se tem estrutura areas_por_safra
          if (firstArea.areas_por_safra) {
            // Atualizar o registro com areas_por_safra
            await supabase
              .from("areas_plantio_projections")
              .update({ areas_por_safra: editedValues })
              .eq("id", firstArea.id);
          } else {
            // Atualizar cada safra individualmente
            for (const [safraId, value] of Object.entries(editedValues)) {
              const existing = filteredAreas.find(a => a.safra_id === safraId);
              
              if (existing) {
                await supabase
                  .from("areas_plantio_projections")
                  .update({ area: value })
                  .eq("id", existing.id);
              }
            }
          }
        }
      } else if (type === 'productivity') {
        const [culturaId, sistemaId] = itemKey.split('|');
        const filteredProds = productivities.filter(p => p.cultura_id === culturaId && p.sistema_id === sistemaId);
        
        if (filteredProds.length > 0) {
          const firstProd = filteredProds[0];
          
          // Verificar se tem estrutura produtividades_por_safra
          if (firstProd.produtividades_por_safra) {
            // Atualizar o registro com produtividades_por_safra
            await supabase
              .from("produtividades_projections")
              .update({ produtividades_por_safra: editedValues })
              .eq("id", firstProd.id);
          } else {
            // Atualizar cada safra individualmente
            for (const [safraId, value] of Object.entries(editedValues)) {
              const existing = filteredProds.find(p => p.safra_id === safraId);
              
              if (existing) {
                await supabase
                  .from("produtividades_projections")
                  .update({ produtividade: value })
                  .eq("id", existing.id);
              }
            }
          }
        }
      } else if (type === 'cost') {
        const [culturaId, sistemaId, categoria] = itemKey.split('|');
        const filteredCosts = productionCosts.filter(c => 
          c.cultura_id === culturaId && 
          c.sistema_id === sistemaId && 
          c.categoria === categoria
        );
        
        if (filteredCosts.length > 0) {
          const firstCost = filteredCosts[0];
          
          // Verificar se tem estrutura custos_por_safra
          if (firstCost.custos_por_safra) {
            // Atualizar o registro com custos_por_safra
            await supabase
              .from("custos_producao_projections")
              .update({ custos_por_safra: editedValues })
              .eq("id", firstCost.id);
          } else {
            // Atualizar cada safra individualmente
            for (const [safraId, value] of Object.entries(editedValues)) {
              const existing = filteredCosts.find(c => c.safra_id === safraId);
              
              if (existing) {
                await supabase
                  .from("custos_producao_projections")
                  .update({ valor: value })
                  .eq("id", existing.id);
              }
            }
          }
        }
      }

      toast.success("Valores atualizados com sucesso!");
      setHasChanges(false);
      
      // Recarregar dados
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar valores");
    } finally {
      setIsSaving(false);
    }
  };

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

  // Agrupar áreas por cultura e sistema
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

  // Agrupar produtividades por cultura e sistema
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

  // Agrupar custos por cultura, sistema e categoria
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[70%] max-w-7xl w-[90vw] max-h-[98vh] overflow-hidden flex flex-col p-0"
        style={{ minWidth: "900px" }}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Editar Dados do Cenário - {projectionName}</DialogTitle>
          <DialogDescription>
            Ajuste os valores de preços, câmbios, áreas, produtividade e custos para cada safra.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
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
                      const hasChanged = false; // Simplificado para evitar comparações complexas

                      return (
                        <div key={safra.id} className="space-y-2">
                          <Label
                            htmlFor={`value-${safra.id}`}
                            className={cn(
                              "text-sm",
                              hasChanged && "text-primary font-medium"
                            )}
                          >
                            {safra.nome}
                          </Label>
                          <Input
                            id={`value-${safra.id}`}
                            type="number"
                            step={selectedItem.startsWith('exchange_') ? "0.0001" : "0.01"}
                            value={currentValue}
                            onChange={(e) => handleValueChange(safra.id, e.target.value)}
                            className={cn(
                              "h-9",
                              hasChanged && "border-primary"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}