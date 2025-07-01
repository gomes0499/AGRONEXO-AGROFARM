"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Copy, TrendingUp } from "lucide-react";
import { ProjectionScenario } from "@/types/projections";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ScenarioListProps {
  scenarios: ProjectionScenario[];
  onSelectScenario: (scenario: ProjectionScenario) => void;
  onDeleteScenario: (scenarioId: string) => void;
  organizationSlug: string;
}

export function ScenarioList({ 
  scenarios, 
  onSelectScenario, 
  onDeleteScenario,
  organizationSlug 
}: ScenarioListProps) {
  const supabase = createClient();
  const router = useRouter();

  const handleDelete = async (scenario: ProjectionScenario) => {
    if (!confirm(`Tem certeza que deseja excluir o cenário "${scenario.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("projection_scenarios")
        .delete()
        .eq("id", scenario.id);

      if (error) throw error;

      toast.success("Cenário excluído com sucesso");
      onDeleteScenario(scenario.id);
    } catch (error) {
      console.error("Erro ao excluir cenário:", error);
      toast.error("Erro ao excluir cenário");
    }
  };

  const handleDuplicate = async (scenario: ProjectionScenario) => {
    try {
      // Buscar dados completos do cenário
      const { data: scenarioData, error: scenarioError } = await supabase
        .from("projection_scenarios")
        .select("*, projection_harvest_data(*), projection_culture_data(*)")
        .eq("id", scenario.id)
        .single();

      if (scenarioError) throw scenarioError;

      // Criar novo cenário
      const { data: newScenario, error: createError } = await supabase
        .from("projection_scenarios")
        .insert({
          organization_id: scenario.organization_id,
          name: `${scenario.name} (Cópia)`,
          description: scenario.description,
          is_baseline: false,
          is_active: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Copiar dados de safra
      if (scenarioData.projection_harvest_data?.length > 0) {
        const harvestData = scenarioData.projection_harvest_data.map((h: any) => ({
          scenario_id: newScenario.id,
          harvest_id: h.harvest_id,
          dollar_rate: h.dollar_rate,
          notes: h.notes,
        }));

        await supabase.from("projection_harvest_data").insert(harvestData);
      }

      // Copiar dados de cultura
      if (scenarioData.projection_culture_data?.length > 0) {
        const cultureData = scenarioData.projection_culture_data.map((c: any) => ({
          scenario_id: newScenario.id,
          harvest_id: c.harvest_id,
          culture_id: c.culture_id,
          area_hectares: c.area_hectares,
          productivity: c.productivity,
          productivity_unit: c.productivity_unit,
          price_per_unit: c.price_per_unit,
        }));

        await supabase.from("projection_culture_data").insert(cultureData);
      }

      toast.success("Cenário duplicado com sucesso");
      router.refresh();
    } catch (error) {
      console.error("Erro ao duplicar cenário:", error);
      toast.error("Erro ao duplicar cenário");
    }
  };

  const getScenarioIcon = (scenario: ProjectionScenario) => {
    if (scenario.is_baseline) return "📊";
    if (scenario.name.toLowerCase().includes("otimista")) return "🚀";
    if (scenario.name.toLowerCase().includes("pessimista")) return "⚠️";
    return "🔮";
  };

  if (scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum cenário criado</h3>
          <p className="text-muted-foreground text-center mb-4">
            Crie seu primeiro cenário de projeção para começar a analisar diferentes possibilidades
          </p>
          <Button onClick={() => router.push(`/dashboard/${organizationSlug}/projections/new`)}>
            Criar Primeiro Cenário
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((scenario) => (
        <Card key={scenario.id} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader 
            className="pb-3"
            onClick={() => onSelectScenario(scenario)}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <span>{getScenarioIcon(scenario)}</span>
                  {scenario.name}
                </CardTitle>
                {scenario.description && (
                  <CardDescription>{scenario.description}</CardDescription>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onSelectScenario(scenario)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(scenario)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar
                  </DropdownMenuItem>
                  {!scenario.is_baseline && (
                    <DropdownMenuItem 
                      onClick={() => handleDelete(scenario)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Criado {formatDistanceToNow(new Date(scenario.created_at), { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </span>
              {scenario.is_baseline && (
                <Badge variant="secondary">Base</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}