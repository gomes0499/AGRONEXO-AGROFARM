"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings2, Calculator, DollarSign, TrendingUp } from "lucide-react";
import {
  getCashPolicyConfig,
  updateCashPolicyConfig,
} from "@/lib/actions/financial-actions/cash-policy-actions";
import { Card } from "@/components/ui/card";

interface CashPolicyConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  projectionRevenue?: Record<string, number>; // Receitas por ano
  projectionCosts?: Record<string, number>; // Custos por ano
  safras?: Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number; }>;
}

type PolicyType = "fixed" | "revenue_percentage" | "cost_percentage";

export function CashPolicyConfig({
  open,
  onOpenChange,
  organizationId,
  projectionRevenue = {},
  projectionCosts = {},
  safras = [],
}: CashPolicyConfigProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [policyType, setPolicyType] = useState<PolicyType>("fixed");
  const [fixedValue, setFixedValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [currency, setCurrency] = useState<"BRL" | "USD">("BRL");

  // Load current configuration
  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open, organizationId]);

  const loadConfig = async () => {
    try {
      const config = await getCashPolicyConfig(organizationId);
      if (config) {
        // Determine policy type from config
        if (config.policy_type === "revenue_percentage") {
          setPolicyType("revenue_percentage");
          setPercentage(config.percentage?.toString() || "");
        } else if (config.policy_type === "cost_percentage") {
          setPolicyType("cost_percentage");
          setPercentage(config.percentage?.toString() || "");
        } else {
          setPolicyType("fixed");
          setFixedValue(config.minimum_cash?.toString() || "");
        }
        setCurrency(config.currency || "BRL");
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    }
  };

  const handleSubmit = async () => {
    // Validação baseada no tipo de política
    if (policyType === "fixed") {
      const value = parseFloat(fixedValue);
      if (!value || value <= 0) {
        toast.error("Por favor, informe um valor mínimo de caixa válido");
        return;
      }
    } else {
      const perc = parseFloat(percentage);
      if (!perc || perc <= 0 || perc > 100) {
        toast.error("Por favor, informe um percentual válido (entre 0 e 100)");
        return;
      }
    }

    setIsLoading(true);
    try {
      await updateCashPolicyConfig(organizationId, {
        enabled: true,
        policy_type: policyType,
        minimum_cash: policyType === "fixed" ? parseFloat(fixedValue) : null,
        percentage: policyType !== "fixed" ? parseFloat(percentage) : null,
        currency,
        priority: "cash",
      });

      toast.success("Política de caixa mínimo atualizada com sucesso");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao salvar configuração");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configurar Política de Caixa Mínimo
          </DialogTitle>
          <DialogDescription>
            Configure a política de caixa mínimo por valor fixo, percentual de receita ou percentual de custos da safra.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Policy Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de Política</Label>
            <RadioGroup value={policyType} onValueChange={(value) => setPolicyType(value as PolicyType)}>
              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="fixed" id="fixed" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="fixed" className="flex items-center gap-2 cursor-pointer">
                      <DollarSign className="h-4 w-4" />
                      Valor Fixo Determinado
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Define um valor fixo mínimo de caixa
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="revenue_percentage" id="revenue_percentage" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="revenue_percentage" className="flex items-center gap-2 cursor-pointer">
                      <TrendingUp className="h-4 w-4" />
                      Percentual da Receita
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Define o caixa mínimo como % da receita de cada safra
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="cost_percentage" id="cost_percentage" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="cost_percentage" className="flex items-center gap-2 cursor-pointer">
                      <Calculator className="h-4 w-4" />
                      Percentual dos Custos
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Define o caixa mínimo como % dos custos de cada safra
                    </p>
                  </div>
                </div>
              </Card>
            </RadioGroup>
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <Label htmlFor="currency">Moeda</Label>
            <Select
              value={currency}
              onValueChange={(value: "BRL" | "USD") => setCurrency(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real (R$)</SelectItem>
                <SelectItem value="USD">Dólar (US$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Value Input based on Policy Type */}
          {policyType === "fixed" ? (
            <div className="space-y-2">
              <Label htmlFor="fixedValue">Valor Mínimo de Caixa</Label>
              <div className="relative">
                <Input
                  id="fixedValue"
                  type="number"
                  value={fixedValue}
                  onChange={(e) => setFixedValue(e.target.value)}
                  placeholder="0,00"
                  className="pr-16"
                  step="0.01"
                  min="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {currency === "BRL" ? "R$" : "US$"}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="percentage">
                Percentual {policyType === "revenue_percentage" ? "da Receita" : "dos Custos"}
              </Label>
              <div className="relative">
                <Input
                  id="percentage"
                  type="number"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder="0"
                  className="pr-12"
                  step="0.1"
                  min="0"
                  max="100"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          )}

          {/* Calculated Result */}
          {policyType === "fixed" ? (
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Caixa Mínimo Configurado:</span>
                <span className="text-lg font-bold text-primary">
                  {formatGenericCurrency(parseFloat(fixedValue) || 0, currency)}
                </span>
              </div>
            </Card>
          ) : (
            <Card className="p-4 bg-muted/50">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Política Configurada:</span>
                  <span className="text-lg font-bold text-primary">
                    {percentage || 0}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {policyType === "revenue_percentage" 
                    ? "O caixa mínimo será calculado como percentual da receita de cada safra"
                    : "O caixa mínimo será calculado como percentual dos custos de cada safra"
                  }
                </p>
                <div className="mt-3 p-2 bg-background rounded border">
                  <p className="text-xs font-medium mb-1">Exemplo de cálculo:</p>
                  <p className="text-xs text-muted-foreground">
                    {policyType === "revenue_percentage"
                      ? `Se a receita de uma safra for R$ 100.000,00, o caixa mínimo será R$ ${((parseFloat(percentage) || 0) * 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : `Se o custo de uma safra for R$ 100.000,00, o caixa mínimo será R$ ${((parseFloat(percentage) || 0) * 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    }
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Information Box */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-900">
            <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Como funciona:</h4>
            <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
              {policyType === "fixed" ? (
                <>
                  <li>• O sistema manterá sempre o valor fixo configurado em caixa</li>
                  <li>• Pagamentos que deixem o caixa abaixo do mínimo serão bloqueados</li>
                </>
              ) : (
                <>
                  <li>• O caixa mínimo será calculado dinamicamente para cada safra</li>
                  <li>• O percentual configurado será aplicado automaticamente</li>
                  <li>• Cada safra terá seu próprio valor mínimo baseado em seus {policyType === "revenue_percentage" ? "receitas" : "custos"}</li>
                </>
              )}
              <li>• A política se aplica a todos os pagamentos de dívidas</li>
              <li>• Você pode alterar a configuração a qualquer momento</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}