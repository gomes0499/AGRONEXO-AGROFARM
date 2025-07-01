"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProjectionScenario } from "@/types/projections";
import { toast } from "sonner";

interface ScenarioSelectorProps {
  organizationId: string;
  organizationSlug: string;
  currentScenarioId?: string;
  onScenarioChange?: (scenarioId: string | null) => void;
}

export function ScenarioSelector({ 
  organizationId, 
  organizationSlug,
  currentScenarioId,
  onScenarioChange 
}: ScenarioSelectorProps) {
  const [scenarios, setScenarios] = useState<ProjectionScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>("baseline");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchScenarios();
  }, [organizationId]);

  useEffect(() => {
    if (currentScenarioId) {
      setSelectedScenario(currentScenarioId);
    }
  }, [currentScenarioId]);

  const fetchScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from("projection_scenarios")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("is_baseline", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setScenarios(data || []);
    } catch (error) {
      console.error("Erro ao buscar cenários:", error);
      toast.error("Erro ao carregar cenários");
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = (value: string) => {
    setSelectedScenario(value);
    
    if (value === "baseline") {
      onScenarioChange?.(null);
    } else if (value === "new") {
      // Redirecionar para criar novo cenário
      router.push(`/dashboard/${organizationSlug}/projections/new`);
    } else {
      onScenarioChange?.(value);
    }
  };

  const handleManageScenarios = () => {
    router.push(`/dashboard/${organizationSlug}/projections`);
  };

  const getScenarioIcon = (scenario: ProjectionScenario) => {
    if (scenario.is_baseline) return "📊";
    if (scenario.name.toLowerCase().includes("otimista")) return "🚀";
    if (scenario.name.toLowerCase().includes("pessimista")) return "⚠️";
    return "🔮";
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-[200px] bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedScenario} onValueChange={handleScenarioChange}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Selecione um cenário" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="baseline">
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span>Dados Reais (Atual)</span>
            </div>
          </SelectItem>
          
          {scenarios.length > 0 && (
            <div className="border-t my-1" />
          )}
          
          {scenarios.map((scenario) => (
            <SelectItem key={scenario.id} value={scenario.id}>
              <div className="flex items-center gap-2">
                <span>{getScenarioIcon(scenario)}</span>
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
        onClick={handleManageScenarios}
        className="hidden sm:flex"
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Gerenciar Projeções
      </Button>
    </div>
  );
}