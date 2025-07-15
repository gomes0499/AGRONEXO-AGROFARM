"use client";

import { useState, useEffect } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Calculator, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/components/auth/organization-provider";
import { CalculateRatingModal } from "@/components/indicators/rating/calculate-rating-modal";
import { ModelEvaluationModal } from "@/components/indicators/rating/model-evaluation-modal";
import { RatingResultModal } from "@/components/indicators/rating/rating-result-modal";
import { getRatingModels } from "@/lib/actions/flexible-rating-actions";
import { toast } from "sonner";

export function RatingSection() {
  const router = useRouter();
  const { organization } = useOrganization();
  const [isCalculateModalOpen, setIsCalculateModalOpen] = useState(false);
  const [isEvaluateModalOpen, setIsEvaluateModalOpen] = useState(false);
  const [showRatingResult, setShowRatingResult] = useState(false);
  const [ratingResult, setRatingResult] = useState<any>(null);
  const [defaultModelId, setDefaultModelId] = useState<string>("");
  const [defaultModelName, setDefaultModelName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (organization?.id) {
      loadDefaultModel();
    }
  }, [organization?.id]);

  const loadDefaultModel = async () => {
    try {
      setIsLoading(true);
      const models = await getRatingModels(organization!.id);
      const defaultModel = models.find(m => m.is_default) || models.find(m => m.nome === 'SR/Prime Rating Model');
      
      if (defaultModel && defaultModel.id) {
        setDefaultModelId(defaultModel.id);
        setDefaultModelName(defaultModel.nome);
      }
    } catch (error) {
      console.error("Error loading default model:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateMetrics = () => {
    setIsEvaluateModalOpen(true);
  };

  const handleCalculateSuccess = (calculation: any) => {
    // Mostrar o modal de resultado ao invés de navegar
    setRatingResult(calculation);
    setShowRatingResult(true);
    setIsCalculateModalOpen(false);
  };

  if (!organization || isLoading) {
    return null;
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Modelo de Rating</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleEvaluateMetrics}
                className="w-full justify-start"
              >
                <Target className="mr-2 h-4 w-4" />
                <span>Avaliar Métricas</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setIsCalculateModalOpen(true)}
                className="w-full justify-start"
                disabled={!defaultModelId}
              >
                <Calculator className="mr-2 h-4 w-4" />
                <span>Calcular Rating</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {defaultModelId && (
        <>
          <ModelEvaluationModal
            organizationId={organization.id}
            modelId={defaultModelId}
            modelName={defaultModelName}
            isOpen={isEvaluateModalOpen}
            onClose={() => setIsEvaluateModalOpen(false)}
          />
          <CalculateRatingModal
            organizationId={organization.id}
            modelId={defaultModelId}
            modelName={defaultModelName}
            isOpen={isCalculateModalOpen}
            onClose={() => setIsCalculateModalOpen(false)}
            onSuccess={handleCalculateSuccess}
          />
          {showRatingResult && ratingResult && (
            <RatingResultModal
              calculation={ratingResult}
              isOpen={showRatingResult}
              onClose={() => {
                setShowRatingResult(false);
                setRatingResult(null);
              }}
              organizationName={organization.nome}
            />
          )}
        </>
      )}
    </>
  );
}