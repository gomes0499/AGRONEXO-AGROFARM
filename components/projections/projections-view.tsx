"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Download, Trash2, List, Edit3, GitCompare } from "lucide-react";
import { MobileTabs } from "@/components/ui/mobile-tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProjectionScenario } from "@/types/projections";
import { ScenarioList } from "./scenario-list";
import { ScenarioEditor } from "./scenario-editor";
import { ScenarioComparison } from "./scenario-comparison";
import { useRouter } from "next/navigation";

interface ProjectionsViewProps {
  organizationId: string;
  organizationSlug: string;
  harvests: any[];
  cultures: any[];
  scenarios: ProjectionScenario[];
}

export function ProjectionsView({
  organizationId,
  organizationSlug,
  harvests,
  cultures,
  scenarios: initialScenarios
}: ProjectionsViewProps) {
  const [scenarios, setScenarios] = useState<ProjectionScenario[]>(initialScenarios);
  const [selectedScenario, setSelectedScenario] = useState<ProjectionScenario | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleCreateScenario = () => {
    router.push(`/dashboard/${organizationSlug}/projections/new`);
  };

  const handleSelectScenario = (scenario: ProjectionScenario) => {
    setSelectedScenario(scenario);
    setActiveTab("editor");
  };

  const handleScenarioUpdated = (updatedScenario: ProjectionScenario) => {
    setScenarios(prev => 
      prev.map(s => s.id === updatedScenario.id ? updatedScenario : s)
    );
    setSelectedScenario(updatedScenario);
  };

  const handleScenarioDeleted = (scenarioId: string) => {
    setScenarios(prev => prev.filter(s => s.id !== scenarioId));
    if (selectedScenario?.id === scenarioId) {
      setSelectedScenario(null);
      setActiveTab("list");
    }
  };

  const tabs = [
    {
      value: "list",
      label: isMobile ? "Lista" : "Lista de Cenários",
      icon: List,
      content: (
        <ScenarioList
          scenarios={scenarios}
          onSelectScenario={handleSelectScenario}
          onDeleteScenario={handleScenarioDeleted}
          organizationSlug={organizationSlug}
        />
      ),
    },
    {
      value: "editor",
      label: "Editor",
      icon: Edit3,
      content: selectedScenario ? (
        <ScenarioEditor
          scenario={selectedScenario}
          harvests={harvests}
          cultures={cultures}
          organizationId={organizationId}
          onUpdate={handleScenarioUpdated}
        />
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Selecione um cenário para editar
          </CardContent>
        </Card>
      ),
    },
    {
      value: "comparison",
      label: "Comparação",
      icon: GitCompare,
      content: (
        <ScenarioComparison
          scenarios={scenarios}
          harvests={harvests}
          cultures={cultures}
          organizationId={organizationId}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Cenários de Projeção</h3>
        <div className="flex gap-2">
          <Button onClick={handleCreateScenario} size={isMobile ? "sm" : "default"}>
            <Plus className="h-4 w-4 mr-2" />
            {isMobile ? "Novo" : "Novo Cenário"}
          </Button>
        </div>
      </div>

      {isMobile ? (
        <MobileTabs 
          tabs={tabs} 
          defaultValue={activeTab}
          onTabChange={setActiveTab}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-[600px] overflow-x-auto">
            <TabsTrigger value="list">Lista de Cenários</TabsTrigger>
            <TabsTrigger value="editor" disabled={!selectedScenario}>
              Editor
            </TabsTrigger>
            <TabsTrigger value="comparison">Comparação</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <ScenarioList
              scenarios={scenarios}
              onSelectScenario={handleSelectScenario}
              onDeleteScenario={handleScenarioDeleted}
              organizationSlug={organizationSlug}
            />
          </TabsContent>

          <TabsContent value="editor" className="space-y-4">
            {selectedScenario && (
              <ScenarioEditor
                scenario={selectedScenario}
                harvests={harvests}
                cultures={cultures}
                organizationId={organizationId}
                onUpdate={handleScenarioUpdated}
              />
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <ScenarioComparison
              scenarios={scenarios}
              harvests={harvests}
              cultures={cultures}
              organizationId={organizationId}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}