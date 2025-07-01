"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, RefreshCw, DollarSign, Wheat, TrendingUp } from "lucide-react";
import { ProjectionScenario, ProjectionHarvestData, ProjectionCultureData } from "@/types/projections";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface ScenarioEditorProps {
  scenario: ProjectionScenario;
  harvests: any[];
  cultures: any[];
  organizationId: string;
  onUpdate: (scenario: ProjectionScenario) => void;
}

export function ScenarioEditor({
  scenario,
  harvests,
  cultures,
  organizationId,
  onUpdate
}: ScenarioEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<string>("");
  const [harvestData, setHarvestData] = useState<Record<string, ProjectionHarvestData>>({});
  const [cultureData, setCultureData] = useState<Record<string, ProjectionCultureData[]>>({});
  const supabase = createClient();

  useEffect(() => {
    if (harvests.length > 0 && !selectedHarvest) {
      setSelectedHarvest(harvests[0].id);
    }
  }, [harvests]);

  useEffect(() => {
    if (scenario.id) {
      loadScenarioData();
    }
  }, [scenario.id]);

  const loadScenarioData = async () => {
    try {
      setLoading(true);

      // Buscar dados de safra
      const { data: harvestDataResult, error: harvestError } = await supabase
        .from("projection_harvest_data")
        .select("*")
        .eq("scenario_id", scenario.id);

      if (harvestError) throw harvestError;

      // Buscar dados de cultura
      const { data: cultureDataResult, error: cultureError } = await supabase
        .from("projection_culture_data")
        .select("*, culture:cultures(*)")
        .eq("scenario_id", scenario.id);

      if (cultureError) throw cultureError;

      // Organizar dados por safra
      const harvestDataMap: Record<string, ProjectionHarvestData> = {};
      harvestDataResult?.forEach(item => {
        harvestDataMap[item.harvest_id] = item;
      });

      const cultureDataMap: Record<string, ProjectionCultureData[]> = {};
      cultureDataResult?.forEach(item => {
        if (!cultureDataMap[item.harvest_id]) {
          cultureDataMap[item.harvest_id] = [];
        }
        cultureDataMap[item.harvest_id].push(item);
      });

      setHarvestData(harvestDataMap);
      setCultureData(cultureDataMap);
    } catch (error) {
      console.error("Erro ao carregar dados do cenário:", error);
      toast.error("Erro ao carregar dados do cenário");
    } finally {
      setLoading(false);
    }
  };

  const handleDollarRateChange = (harvestId: string, value: number) => {
    setHarvestData(prev => ({
      ...prev,
      [harvestId]: {
        ...prev[harvestId],
        harvest_id: harvestId,
        scenario_id: scenario.id,
        dollar_rate: value
      }
    }));
  };

  const handleCultureDataChange = (
    harvestId: string, 
    cultureId: string, 
    field: keyof ProjectionCultureData, 
    value: any
  ) => {
    setCultureData(prev => {
      const harvestCultures = prev[harvestId] || [];
      const existingIndex = harvestCultures.findIndex(c => c.culture_id === cultureId);
      
      if (existingIndex >= 0) {
        const updated = [...harvestCultures];
        updated[existingIndex] = {
          ...updated[existingIndex],
          [field]: value
        };
        return { ...prev, [harvestId]: updated };
      } else {
        const newCulture: ProjectionCultureData = {
          id: `new-${Date.now()}`,
          scenario_id: scenario.id,
          harvest_id: harvestId,
          culture_id: cultureId,
          area_hectares: 0,
          productivity: 0,
          productivity_unit: "sc/ha",
          price_per_unit: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          [field]: value
        };
        return { ...prev, [harvestId]: [...harvestCultures, newCulture] };
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Salvar dados de safra
      for (const [harvestId, data] of Object.entries(harvestData)) {
        if (data.dollar_rate) {
          const { error } = await supabase
            .from("projection_harvest_data")
            .upsert({
              scenario_id: scenario.id,
              harvest_id: harvestId,
              dollar_rate: data.dollar_rate,
              notes: data.notes
            });

          if (error) throw error;
        }
      }

      // Salvar dados de cultura
      for (const [harvestId, cultures] of Object.entries(cultureData)) {
        for (const culture of cultures) {
          if (culture.area_hectares > 0 || culture.productivity > 0 || culture.price_per_unit > 0) {
            const { error } = await supabase
              .from("projection_culture_data")
              .upsert({
                scenario_id: scenario.id,
                harvest_id: harvestId,
                culture_id: culture.culture_id,
                area_hectares: culture.area_hectares || 0,
                productivity: culture.productivity || 0,
                productivity_unit: culture.productivity_unit || "sc/ha",
                price_per_unit: culture.price_per_unit || 0
              });

            if (error) throw error;
          }
        }
      }

      toast.success("Cenário salvo com sucesso");
      onUpdate(scenario);
    } catch (error) {
      console.error("Erro ao salvar cenário:", error);
      toast.error("Erro ao salvar cenário");
    } finally {
      setSaving(false);
    }
  };

  const calculateRevenue = (harvestId: string) => {
    const harvestCultures = cultureData[harvestId] || [];
    const dollarRate = harvestData[harvestId]?.dollar_rate || 5.0;

    return harvestCultures.reduce((total, culture) => {
      const area = culture.area_hectares || 0;
      const productivity = culture.productivity || 0;
      const price = culture.price_per_unit || 0;
      return total + (area * productivity * price * dollarRate);
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

  const currentHarvest = harvests.find(h => h.id === selectedHarvest);
  const currentHarvestData = harvestData[selectedHarvest] || {};
  const currentCultureData = cultureData[selectedHarvest] || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{scenario.name}</CardTitle>
          {scenario.description && (
            <CardDescription>{scenario.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      <div className="flex items-center justify-between">
        <Select value={selectedHarvest} onValueChange={setSelectedHarvest}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione a safra" />
          </SelectTrigger>
          <SelectContent>
            {harvests.map(harvest => (
              <SelectItem key={harvest.id} value={harvest.id}>
                {harvest.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <Tabs defaultValue="dollar" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dollar">
            <DollarSign className="h-4 w-4 mr-2" />
            Taxa de Câmbio
          </TabsTrigger>
          <TabsTrigger value="cultures">
            <Wheat className="h-4 w-4 mr-2" />
            Culturas
          </TabsTrigger>
          <TabsTrigger value="summary">
            <TrendingUp className="h-4 w-4 mr-2" />
            Resumo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dollar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Câmbio (USD/BRL)</CardTitle>
              <CardDescription>
                Defina a taxa de câmbio projetada para a safra {currentHarvest?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Dólar (R$)</Label>
                  <span className="text-2xl font-bold">
                    {formatCurrency(currentHarvestData.dollar_rate || 5.0)}
                  </span>
                </div>
                <Slider
                  value={[currentHarvestData.dollar_rate || 5.0]}
                  onValueChange={([value]) => handleDollarRateChange(selectedHarvest, value)}
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
        </TabsContent>

        <TabsContent value="cultures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Culturas e Produtividade</CardTitle>
              <CardDescription>
                Configure área, produtividade e preços para cada cultura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cultura</TableHead>
                    <TableHead>Área (ha)</TableHead>
                    <TableHead>Produtividade</TableHead>
                    <TableHead>Preço (R$/un)</TableHead>
                    <TableHead>Receita Estimada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cultures.map(culture => {
                    const cultureProjection = currentCultureData.find(c => c.culture_id === culture.id) || {} as any;
                    const area = cultureProjection.area_hectares || 0;
                    const productivity = cultureProjection.productivity || 0;
                    const price = cultureProjection.price_per_unit || 0;
                    const dollarRate = currentHarvestData.dollar_rate || 5.0;
                    const revenue = area * productivity * price * dollarRate;

                    return (
                      <TableRow key={culture.id}>
                        <TableCell className="font-medium">{culture.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={area}
                            onChange={(e) => handleCultureDataChange(
                              selectedHarvest,
                              culture.id,
                              "area_hectares",
                              parseFloat(e.target.value) || 0
                            )}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={productivity}
                            onChange={(e) => handleCultureDataChange(
                              selectedHarvest,
                              culture.id,
                              "productivity",
                              parseFloat(e.target.value) || 0
                            )}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={price}
                            onChange={(e) => handleCultureDataChange(
                              selectedHarvest,
                              culture.id,
                              "price_per_unit",
                              parseFloat(e.target.value) || 0
                            )}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(revenue)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Projeção</CardTitle>
              <CardDescription>
                Safra {currentHarvest?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Taxa de Câmbio</Label>
                  <p className="text-2xl font-bold">
                    {formatCurrency(currentHarvestData.dollar_rate || 5.0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Área Total</Label>
                  <p className="text-2xl font-bold">
                    {currentCultureData.reduce((sum, c) => sum + (c.area_hectares || 0), 0).toLocaleString('pt-BR')} ha
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Receita Projetada</Label>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculateRevenue(selectedHarvest))}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="font-semibold mb-2">Distribuição por Cultura</h4>
                <div className="space-y-2">
                  {currentCultureData
                    .filter(c => c.area_hectares > 0)
                    .map(cultureProj => {
                      const culture = cultures.find(c => c.id === cultureProj.culture_id);
                      const revenue = (cultureProj.area_hectares || 0) * 
                                    (cultureProj.productivity || 0) * 
                                    (cultureProj.price_per_unit || 0) * 
                                    (currentHarvestData.dollar_rate || 5.0);
                      const totalRevenue = calculateRevenue(selectedHarvest);
                      const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

                      return (
                        <div key={cultureProj.culture_id} className="flex items-center justify-between">
                          <span className="text-sm">{culture?.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{formatCurrency(revenue)}</span>
                            <span className="text-sm text-muted-foreground">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}