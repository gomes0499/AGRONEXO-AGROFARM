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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2 } from "lucide-react";
import {
  getCashPolicyConfig,
  updateCashPolicyConfig,
} from "@/lib/actions/financial-actions/cash-policy-actions";

interface CashPolicyConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export function CashPolicyConfigDialog({
  open,
  onOpenChange,
  organizationId,
}: CashPolicyConfigDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [minimumCash, setMinimumCash] = useState("");
  const [currency, setCurrency] = useState<"BRL" | "USD">("BRL");
  const [priority, setPriority] = useState<"debt" | "cash">("cash");

  // Carregar configuração atual
  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open, organizationId]);

  const loadConfig = async () => {
    try {
      const config = await getCashPolicyConfig(organizationId);
      if (config) {
        setEnabled(config.enabled || false);
        setMinimumCash(config.minimum_cash?.toString() || "");
        setCurrency(config.currency || "BRL");
        setPriority(config.priority || "cash");
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    }
  };

  const handleSubmit = async () => {
    if (enabled && (!minimumCash || parseFloat(minimumCash) <= 0)) {
      toast.error("Por favor, informe um valor mínimo de caixa válido");
      return;
    }

    setIsLoading(true);
    try {
      await updateCashPolicyConfig(organizationId, {
        enabled,
        minimum_cash: enabled ? parseFloat(minimumCash) : null,
        currency,
        priority,
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
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configurar Política de Caixa Mínimo
          </DialogTitle>
          <DialogDescription>
            Configure a política de caixa mínimo para controlar o pagamento de
            dívidas. Quando ativada, o sistema não permitirá pagamentos que
            deixem o caixa abaixo do valor mínimo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Ativar política de caixa mínimo</Label>
              <p className="text-sm text-muted-foreground">
                Impede pagamentos que deixem o caixa abaixo do mínimo
              </p>
            </div>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <>
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

              <div className="space-y-2">
                <Label htmlFor="minimumCash">Valor mínimo de caixa</Label>
                <div className="relative">
                  <Input
                    id="minimumCash"
                    type="number"
                    value={minimumCash}
                    onChange={(e) => setMinimumCash(e.target.value)}
                    placeholder="0,00"
                    className="pr-16"
                    step="0.01"
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {currency === "BRL" ? "R$" : "US$"}
                  </span>
                </div>
                {minimumCash && (
                  <p className="text-sm text-muted-foreground">
                    {formatGenericCurrency(parseFloat(minimumCash), currency)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade em caso de conflito</Label>
                <Select
                  value={priority}
                  onValueChange={(value: "debt" | "cash") => setPriority(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      Preservar caixa mínimo (não pagar dívida)
                    </SelectItem>
                    <SelectItem value="debt">
                      Pagar dívida (permitir ficar abaixo do mínimo)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Define o comportamento quando um pagamento deixaria o caixa
                  abaixo do mínimo
                </p>
              </div>
            </>
          )}

          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium mb-2">Como funciona:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                • Quando ativada, o sistema verificará o saldo antes de
                processar pagamentos
              </li>
              <li>
                • Pagamentos que deixem o caixa abaixo do mínimo serão
                bloqueados
              </li>
              <li>• A política se aplica a todos os pagamentos de dívidas</li>
              <li>• Você pode definir prioridades para casos especiais</li>
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
