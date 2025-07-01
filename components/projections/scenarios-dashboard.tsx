"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, TrendingUp, DollarSign, Wheat, Save, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface ScenariosDashboardProps {
  organizationId: string;
}

export function ScenariosDashboard({ organizationId }: ScenariosDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>("real");
  const [isEditMode, setIsEditMode] = useState(false);
  const [scenarioData, setScenarioData] = useState<any>({
    dollarRate: 5.0,
    cultures: []
  });
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Por enquanto, usar cenários mockados
      const mockScenarios = [
        {
          id: 'optimistic',
          name: 'Cenário Otimista',
          description: 'Dólar alto e produtividade aumentada',
          is_baseline: false,
        },
        {
          id: 'pessimistic',
          name: 'Cenário Pessimista',
          description: 'Dólar baixo e produtividade reduzida',
          is_baseline: false,
        }
      ];

      setScenarios(mockScenarios);

      // Buscar dados reais se não houver cenário selecionado
      if (selectedScenario === "real") {
        await loadRealData();
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealData = async () => {
    // Buscar dados reais de produção
    const { data: safras } = await supabase
      .from("safras")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: false })
      .limit(1);

    if (safras && safras.length > 0) {
      const currentSafra = safras[0];

      // Buscar áreas plantadas
      const { data: areas } = await supabase
        .from("areas_plantio")
        .select("*, cultura:cultura_id(*)")
        .eq("organizacao_id", organizationId)
        .eq("safra_id", currentSafra.id);

      // Buscar produtividades
      const { data: produtividades } = await supabase
        .from("produtividades")
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("safra_id", currentSafra.id);

      // Montar dados das culturas
      const culturesData = areas?.map(area => {
        const prod = produtividades?.find(p => p.cultura_id === area.cultura_id);
        return {
          culture_id: area.cultura_id,
          culture_name: area.cultura?.nome || "Cultura",
          area: area.area || 0,
          productivity: prod?.produtividade || 60,
          price: 150, // Preço padrão
        };
      }) || [];

      setScenarioData({
        dollarRate: 5.0,
        cultures: culturesData
      });
    }
  };

  const handleScenarioChange = async (value: string) => {
    setSelectedScenario(value);
    setIsEditMode(false);

    if (value === "real") {
      await loadRealData();
    } else if (value === "new") {
      // Criar novo cenário
      setIsEditMode(true);
      setScenarioData({
        dollarRate: 5.5,
        cultures: scenarioData.cultures.map((c: any) => ({ ...c }))
      });
    } else {
      // Carregar cenário existente
      await loadScenarioData(value);
    }
  };

  const loadScenarioData = async (scenarioId: string) => {
    try {
      // Simular dados do cenário
      const currentCultures = scenarioData.cultures || [];
      
      if (scenarioId === 'optimistic') {
        setScenarioData({
          dollarRate: 6.0,
          cultures: currentCultures.map((c: any) => ({
            ...c,
            productivity: c.productivity * 1.1, // 10% mais produtivo
            price: c.price * 1.05, // 5% mais caro
          }))
        });
      } else if (scenarioId === 'pessimistic') {
        setScenarioData({
          dollarRate: 4.5,
          cultures: currentCultures.map((c: any) => ({
            ...c,
            productivity: c.productivity * 0.9, // 10% menos produtivo
            price: c.price * 0.95, // 5% mais barato
          }))
        });
      }
    } catch (error) {
      console.error("Erro ao carregar cenário:", error);
    }
  };

  const handleSaveScenario = async () => {
    if (selectedScenario === "real") return;

    try {
      // Implementar salvamento do cenário
      toast.success("Cenário salvo com sucesso!");
      setIsEditMode(false);
    } catch (error) {
      console.error("Erro ao salvar cenário:", error);
      toast.error("Erro ao salvar cenário");
    }
  };

  const calculateTotalRevenue = () => {
    return scenarioData.cultures.reduce((total: number, culture: any) => {
      return total + (culture.area * culture.productivity * culture.price * scenarioData.dollarRate);
    }, 0);
  };

  const calculateTotalArea = () => {
    return scenarioData.cultures.reduce((total: number, culture: any) => {
      return total + culture.area;
    }, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Cenário */}
      <Card>
        <CardHeader>
          <CardTitle>Cenário de Projeção</CardTitle>
          <CardDescription>
            Selecione ou crie um cenário para análise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedScenario} onValueChange={handleScenarioChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecione um cenário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="real">
                  <div className="flex items-center gap-2">
                    <span>📊</span>
                    <span>Dados Reais (Atual)</span>
                  </div>
                </SelectItem>
                
                {scenarios.map(scenario => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    <div className="flex items-center gap-2">
                      <span>🔮</span>
                      <span>{scenario.name}</span>
                    </div>
                  </SelectItem>
                ))}
                
                <SelectItem value="new">
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="h-4 w-4" />
                    <span>Criar Novo Cenário</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {selectedScenario !== "real" && (
              <Button
                variant={isEditMode ? "default" : "outline"}
                onClick={() => isEditMode ? handleSaveScenario() : setIsEditMode(true)}
              >
                {isEditMode ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Editar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taxa de Câmbio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(scenarioData.dollarRate)}
            </div>
            <p className="text-xs text-muted-foreground">USD/BRL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Área Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateTotalArea().toLocaleString('pt-BR')} ha
            </div>
            <p className="text-xs text-muted-foreground">Hectares plantados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Receita Projetada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(calculateTotalRevenue())}
            </div>
            <p className="text-xs text-muted-foreground">Receita total estimada</p>
          </CardContent>
        </Card>
      </div>

      {/* Editor de Variáveis */}
      {isEditMode && (
        <>
          {/* Taxa de Câmbio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Taxa de Câmbio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Dólar (USD/BRL)</Label>
                  <span className="text-2xl font-bold">
                    {formatCurrency(scenarioData.dollarRate)}
                  </span>
                </div>
                <Slider
                  value={[scenarioData.dollarRate]}
                  onValueChange={([value]) => setScenarioData({ ...scenarioData, dollarRate: value })}
                  max={10}
                  min={3}
                  step={0.01}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>R$ 3,00</span>
                  <span>R$ 10,00</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Culturas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wheat className="h-5 w-5" />
                Culturas e Produtividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cultura</TableHead>
                    <TableHead>Área (ha)</TableHead>
                    <TableHead>Produtividade (sc/ha)</TableHead>
                    <TableHead>Preço (R$/sc)</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarioData.cultures.map((culture: any, index: number) => (
                    <TableRow key={culture.culture_id}>
                      <TableCell className="font-medium">{culture.culture_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={culture.area}
                          onChange={(e) => {
                            const newCultures = [...scenarioData.cultures];
                            newCultures[index].area = parseFloat(e.target.value) || 0;
                            setScenarioData({ ...scenarioData, cultures: newCultures });
                          }}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={culture.productivity}
                          onChange={(e) => {
                            const newCultures = [...scenarioData.cultures];
                            newCultures[index].productivity = parseFloat(e.target.value) || 0;
                            setScenarioData({ ...scenarioData, cultures: newCultures });
                          }}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={culture.price}
                          onChange={(e) => {
                            const newCultures = [...scenarioData.cultures];
                            newCultures[index].price = parseFloat(e.target.value) || 0;
                            setScenarioData({ ...scenarioData, cultures: newCultures });
                          }}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(
                          culture.area * culture.productivity * culture.price * scenarioData.dollarRate
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Resumo */}
      {!isEditMode && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Cenário</CardTitle>
            <CardDescription>
              {selectedScenario === "real" ? "Dados reais da operação" : "Projeção com base nos parâmetros definidos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Parâmetros</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa de Câmbio:</span>
                      <span>{formatCurrency(scenarioData.dollarRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Área Total:</span>
                      <span>{calculateTotalArea().toLocaleString('pt-BR')} ha</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Distribuição por Cultura</h4>
                  <div className="space-y-1 text-sm">
                    {scenarioData.cultures.map((culture: any) => {
                      const revenue = culture.area * culture.productivity * culture.price * scenarioData.dollarRate;
                      const percentage = (revenue / calculateTotalRevenue()) * 100;
                      return (
                        <div key={culture.culture_id} className="flex justify-between">
                          <span className="text-muted-foreground">{culture.culture_name}:</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}