"use client";

import { IndicatorThresholdViewer } from "@/components/indicators/indicator-threshold-viewer";
import { RatingModelsManager } from "@/components/indicators/rating/rating-models-manager";
import { RatingMetricsTab } from "@/components/indicators/rating/rating-metrics-tab";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTriggerPrimary,
} from "@/components/ui/tabs";
import type { IndicatorsPageData } from "@/lib/actions/indicators/unified-indicators-actions";

interface IndicatorsPageClientProps {
  initialData: IndicatorsPageData;
}

export function IndicatorsPageClient({
  initialData,
}: IndicatorsPageClientProps) {
  const {
    indicatorConfigs,
    ratingModels,
    ratingMetrics,
    qualitativeValues,
    indicatorData,
    organizationId,
  } = initialData;

  // Verificar se temos dados suficientes
  const hasData = Object.values(indicatorData).some(
    (value) => value !== undefined
  );

  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="thresholds" className="w-full max-w-full">
        <div className="bg-card border-b overflow-x-auto">
          <div className="container max-w-full px-4 md:px-6 py-2">
            <TabsList>
              <TabsTriggerPrimary value="thresholds">
                Limiares
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="rating">
                Modelos de Rating
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="metrics">Métricas</TabsTriggerPrimary>
            </TabsList>
          </div>
        </div>

        <div className="p-4 md:p-6 pt-4">
          {hasData ? (
            <>
              <TabsContent value="thresholds" className="space-y-4">
                <IndicatorThresholdViewer indicatorConfigs={indicatorConfigs} />
              </TabsContent>

              <TabsContent value="rating" className="space-y-4">
                <RatingModelsManager organizationId={organizationId} />
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <RatingMetricsTab
                  organizationId={organizationId}
                  initialMetrics={ratingMetrics}
                  initialQualitativeValues={qualitativeValues}
                />
              </TabsContent>
            </>
          ) : (
            <EmptyState
              title="Sem dados de indicadores"
              description="Não há dados de indicadores financeiros disponíveis no momento."
            />
          )}
        </div>
      </Tabs>
    </div>
  );
}
