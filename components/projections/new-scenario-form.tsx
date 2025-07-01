"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

interface NewScenarioFormProps {
  organizationId: string;
  organizationSlug: string;
}

export function NewScenarioForm({ organizationId, organizationSlug }: NewScenarioFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "custom", // custom, optimistic, pessimistic
  });
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome do cenário é obrigatório");
      return;
    }

    try {
      setLoading(true);

      // Criar o cenário
      const { data: scenario, error } = await supabase
        .from("projection_scenarios")
        .insert({
          organization_id: organizationId,
          name: formData.name,
          description: formData.description,
          is_baseline: false,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Se for um cenário otimista ou pessimista, podemos pré-configurar alguns valores
      if (formData.type !== "custom") {
        await createPresetData(scenario.id, formData.type);
      }

      toast.success("Cenário criado com sucesso");
      router.push(`/dashboard/${organizationSlug}/projections`);
    } catch (error) {
      console.error("Erro ao criar cenário:", error);
      toast.error("Erro ao criar cenário");
    } finally {
      setLoading(false);
    }
  };

  const createPresetData = async (scenarioId: string, type: string) => {
    // Buscar dados atuais para usar como base
    const { data: harvests } = await supabase
      .from("harvests")
      .select("id")
      .eq("organization_id", organizationId);

    if (!harvests || harvests.length === 0) return;

    // Definir valores preset baseado no tipo
    const dollarRate = type === "optimistic" ? 6.0 : 4.5;
    const productivityMultiplier = type === "optimistic" ? 1.1 : 0.9;

    // Criar dados de safra com dólar preset
    const harvestData = harvests.map(harvest => ({
      scenario_id: scenarioId,
      harvest_id: harvest.id,
      dollar_rate: dollarRate,
      notes: type === "optimistic" 
        ? "Cenário otimista com dólar alto e produtividade aumentada"
        : "Cenário pessimista com dólar baixo e produtividade reduzida",
    }));

    await supabase.from("projection_harvest_data").insert(harvestData);
  };

  const getScenarioTypeIcon = (type: string) => {
    switch (type) {
      case "optimistic": return "🚀";
      case "pessimistic": return "⚠️";
      default: return "🔮";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cenário</CardTitle>
          <CardDescription>
            Defina um nome e descrição para identificar seu cenário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cenário *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Cenário Dólar Alto 2025"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva as principais premissas deste cenário..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipo de Cenário</CardTitle>
          <CardDescription>
            Escolha um tipo para começar com valores pré-configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getScenarioTypeIcon("custom")}</span>
                  <div>
                    <p className="font-medium">Personalizado</p>
                    <p className="text-sm text-muted-foreground">
                      Comece do zero e configure todos os valores manualmente
                    </p>
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="optimistic" id="optimistic" />
              <Label htmlFor="optimistic" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getScenarioTypeIcon("optimistic")}</span>
                  <div>
                    <p className="font-medium">Otimista</p>
                    <p className="text-sm text-muted-foreground">
                      Dólar alto (R$ 6,00) e produtividade 10% maior
                    </p>
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="pessimistic" id="pessimistic" />
              <Label htmlFor="pessimistic" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getScenarioTypeIcon("pessimistic")}</span>
                  <div>
                    <p className="font-medium">Pessimista</p>
                    <p className="text-sm text-muted-foreground">
                      Dólar baixo (R$ 4,50) e produtividade 10% menor
                    </p>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Criando..." : "Criar Cenário"}
        </Button>
      </div>
    </form>
  );
}