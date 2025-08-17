"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings, Save, RotateCcw, Percent } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  getBalanceSheetPremises,
  updateBalanceSheetPremises,
  resetBalanceSheetPremises,
  type BalanceSheetPremises,
} from "@/lib/actions/balance-sheet-config-actions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface BalanceSheetPremisesFormProps {
  organizationId: string;
  onSuccess?: () => void;
}

export function BalanceSheetPremisesForm({ organizationId, onSuccess }: BalanceSheetPremisesFormProps) {
  const [premises, setPremises] = useState<BalanceSheetPremises | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPremises();
  }, [organizationId]);

  const loadPremises = async () => {
    try {
      setIsLoading(true);
      const data = await getBalanceSheetPremises(organizationId);
      setPremises(data);
    } catch (error) {
      console.error("Erro ao carregar premissas:", error);
      toast.error("Não foi possível carregar as premissas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!premises) return;

    try {
      setIsSaving(true);
      await updateBalanceSheetPremises(organizationId, premises);
      toast.success("Premissas salvas com sucesso");
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar premissas:", error);
      toast.error("Não foi possível salvar as premissas");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      const data = await resetBalanceSheetPremises(organizationId);
      setPremises(data);
      toast.success("Premissas restauradas para valores padrão");
    } catch (error) {
      console.error("Erro ao resetar premissas:", error);
      toast.error("Não foi possível restaurar as premissas");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof BalanceSheetPremises, value: string) => {
    if (!premises) return;
    
    // Converter para número e dividir por 100 (pois estamos mostrando como percentual)
    const numValue = parseFloat(value) / 100;
    
    setPremises({
      ...premises,
      [field]: isNaN(numValue) ? 0 : numValue,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!premises) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Erro ao carregar premissas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeaderPrimary
        icon={<Settings className="h-5 w-5" />}
        title="Premissas do Balanço Patrimonial"
        description="Configure os percentuais e parâmetros utilizados no cálculo do balanço"
      />
      <CardContent className="p-6">
        <Accordion type="single" collapsible defaultValue="estimativas">
          {/* Estimativas */}
          <AccordionItem value="estimativas">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Estimativas e Proporções
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estoques">
                    Estoques (% do Custo de Produção)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="estoques"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={(premises.estoques_percentual_custo * 100).toFixed(1)}
                      onChange={(e) => handleInputChange("estoques_percentual_custo", e.target.value)}
                      className="text-right"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Percentual do custo de produção estimado como estoque
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adiantamentos">
                    Adiantamentos (% de Fornecedores)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="adiantamentos"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={(premises.adiantamentos_fornecedores_percentual * 100).toFixed(1)}
                      onChange={(e) => handleInputChange("adiantamentos_fornecedores_percentual", e.target.value)}
                      className="text-right"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Percentual de fornecedores considerado como adiantamento
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contas_receber">
                    Contas a Receber (% da Receita)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="contas_receber"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={(premises.contas_receber_percentual_receita * 100).toFixed(1)}
                      onChange={(e) => handleInputChange("contas_receber_percentual_receita", e.target.value)}
                      className="text-right"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Percentual da receita em contas a receber
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Prazos de Dívidas */}
          <AccordionItem value="prazos">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Classificação de Prazos
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bancos_cp">
                    Dívidas Bancárias - Curto Prazo
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="bancos_cp"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={(premises.bancos_curto_prazo * 100).toFixed(0)}
                      onChange={(e) => handleInputChange("bancos_curto_prazo", e.target.value)}
                      className="text-right"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Percentual classificado como curto prazo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bancos_lp">
                    Dívidas Bancárias - Longo Prazo
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="bancos_lp"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={(premises.bancos_longo_prazo * 100).toFixed(0)}
                      onChange={(e) => handleInputChange("bancos_longo_prazo", e.target.value)}
                      className="text-right"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Percentual classificado como longo prazo
                  </p>
                </div>
              </div>
              
              {/* Validação visual */}
              {Math.abs((premises.bancos_curto_prazo + premises.bancos_longo_prazo) - 1) > 0.01 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ⚠️ Atenção: A soma de curto e longo prazo deve ser 100%
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Depreciação */}
          <AccordionItem value="depreciacao">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Taxas de Depreciação Anual
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dep_maquinas">
                    Máquinas e Equipamentos
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dep_maquinas"
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={(premises.depreciacao_maquinas * 100).toFixed(1)}
                      onChange={(e) => handleInputChange("depreciacao_maquinas", e.target.value)}
                      className="text-right"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dep_veiculos">
                    Veículos
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dep_veiculos"
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={(premises.depreciacao_veiculos * 100).toFixed(1)}
                      onChange={(e) => handleInputChange("depreciacao_veiculos", e.target.value)}
                      className="text-right"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dep_benfeitorias">
                    Benfeitorias
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dep_benfeitorias"
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={(premises.depreciacao_benfeitorias * 100).toFixed(1)}
                      onChange={(e) => handleInputChange("depreciacao_benfeitorias", e.target.value)}
                      className="text-right"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Impostos */}
          <AccordionItem value="impostos">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Impostos e Taxas
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="impostos_vendas">
                    Impostos sobre Vendas
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="impostos_vendas"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={(premises.impostos_sobre_vendas * 100).toFixed(1)}
                      onChange={(e) => handleInputChange("impostos_sobre_vendas", e.target.value)}
                      className="text-right"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provisao_impostos">
                    Provisão para Impostos
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="provisao_impostos"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={(premises.provisao_impostos * 100).toFixed(1)}
                      onChange={(e) => handleInputChange("provisao_impostos", e.target.value)}
                      className="text-right"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Botões de ação */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrões
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Premissas"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}