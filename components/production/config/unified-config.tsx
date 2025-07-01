"use client";

import { CulturesTab } from "./cultures-tab";
import { SystemsTab } from "./systems-tab";
import { CyclesTab } from "./cycles-tab";
import { HarvestsTab } from "./harvests-tab";
import { ProductionConfigInitializer } from "./production-config-initializer";
import { Culture, System, Cycle, Harvest } from "@/schemas/production";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { Button } from "@/components/ui/button";
import { Wheat, Settings, RotateCcw, Calendar, Plus } from "lucide-react";
import { useRef, useState } from "react";

interface UnifiedConfigProps {
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  harvests: Harvest[];
  organizationId: string;
}

export function UnifiedConfig({
  cultures,
  systems,
  cycles,
  harvests,
  organizationId,
}: UnifiedConfigProps) {
  const culturesRef = useRef<any>(null);
  const systemsRef = useRef<any>(null);
  const cyclesRef = useRef<any>(null);
  const harvestsRef = useRef<any>(null);

  // Check if configurations are missing
  const hasCultures = cultures && cultures.length > 0;
  const hasSystems = systems && systems.length > 0;
  const hasCycles = cycles && cycles.length > 0;
  const hasHarvests = harvests && harvests.length > 0;
  const isConfigComplete = hasCultures && hasSystems && hasCycles && hasHarvests;

  const [configChanged, setConfigChanged] = useState(false);

  const handleConfigChanged = () => {
    setConfigChanged(!configChanged);
    // Force a page refresh to reload data
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Mostrar inicializador se houver configurações faltantes */}
      {!isConfigComplete && (
        <ProductionConfigInitializer
          organizationId={organizationId}
          hasCultures={hasCultures}
          hasSystems={hasSystems}
          hasCycles={hasCycles}
          hasHarvests={hasHarvests}
          onConfigChanged={handleConfigChanged}
        />
      )}
      {/* Grid dos 3 primeiros cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Culturas */}
        <Card className="shadow-sm border-muted/80">
          <CardHeaderPrimary
            title="Culturas"
            icon={<Wheat className="h-5 w-5" />}
            description="Configuração das culturas plantadas na organização"
            action={
              <Button
                size="icon"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-full h-8 w-8"
                onClick={() => culturesRef.current?.handleCreate()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            }
            className="mb-4"
          />
          <CardContent>
            <CulturesTab
              key={`cultures-${organizationId}`}
              ref={culturesRef}
              initialCultures={cultures}
              organizationId={organizationId}
            />
          </CardContent>
        </Card>

        {/* Sistemas */}
        <Card className="shadow-sm border-muted/80">
          <CardHeaderPrimary
            title="Sistemas de Produção"
            icon={<Settings className="h-5 w-5" />}
            description="Configuração dos sistemas de cultivo (sequeiro, irrigado, etc.)"
            action={
              <Button
                size="icon"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-full h-8 w-8"
                onClick={() => systemsRef.current?.handleCreate()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            }
            className="mb-4"
          />
          <CardContent>
            <SystemsTab
              key={`systems-${organizationId}`}
              ref={systemsRef}
              initialSystems={systems}
              organizationId={organizationId}
            />
          </CardContent>
        </Card>

        {/* Ciclos */}
        <Card className="shadow-sm border-muted/80">
          <CardHeaderPrimary
            title="Ciclos de Plantio"
            icon={<RotateCcw className="h-5 w-5" />}
            description="Configuração dos ciclos de plantio (1ª safra, 2ª safra, etc.)"
            action={
              <Button
                size="icon"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-full h-8 w-8"
                onClick={() => cyclesRef.current?.handleCreate()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            }
            className="mb-4"
          />
          <CardContent>
            <CyclesTab
              key={`cycles-${organizationId}`}
              ref={cyclesRef}
              initialCycles={cycles}
              organizationId={organizationId}
            />
          </CardContent>
        </Card>
      </div>

      {/* Safras - card único */}
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          title="Safras"
          icon={<Calendar className="h-5 w-5" />}
          description="Configuração dos períodos de safras (2023/24, 2024/25, etc.)"
          action={
            <Button
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
              onClick={() => harvestsRef.current?.handleCreate()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Safra
            </Button>
          }
          className="mb-4"
        />
        <CardContent>
          <HarvestsTab
            key={`harvests-${organizationId}`}
            ref={harvestsRef}
            initialHarvests={harvests}
            organizationId={organizationId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
