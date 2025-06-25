"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Safra {
  id: string;
  nome: string;
}

interface CurrencyConfig {
  safraId: string;
  moedaPrincipal: "BRL" | "USD";
  taxaCambio?: number; // Taxa de câmbio USD/BRL para conversão
}

interface CurrencyConfigModalProps {
  safras: Safra[];
  configs: CurrencyConfig[];
  onSave: (configs: CurrencyConfig[]) => void;
}

export function CurrencyConfigModal({
  safras,
  configs: initialConfigs,
  onSave,
}: CurrencyConfigModalProps) {
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState<CurrencyConfig[]>(
    safras.map(safra => {
      const existingConfig = initialConfigs.find(c => c.safraId === safra.id);
      return existingConfig || {
        safraId: safra.id,
        moedaPrincipal: "BRL",
        taxaCambio: 5.00, // Taxa padrão
      };
    })
  );

  const handleMoedaChange = (safraId: string, moeda: "BRL" | "USD") => {
    setConfigs(prev =>
      prev.map(config =>
        config.safraId === safraId
          ? { ...config, moedaPrincipal: moeda }
          : config
      )
    );
  };

  const handleTaxaChange = (safraId: string, taxa: string) => {
    const taxaNum = parseFloat(taxa);
    if (!isNaN(taxaNum) && taxaNum > 0) {
      setConfigs(prev =>
        prev.map(config =>
          config.safraId === safraId
            ? { ...config, taxaCambio: taxaNum }
            : config
        )
      );
    }
  };

  const handleSave = () => {
    onSave(configs);
    toast.success("Configurações de moeda salvas com sucesso!");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurar Moedas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configuração de Moeda por Safra</DialogTitle>
          <DialogDescription>
            Configure a moeda principal e taxa de câmbio para cada safra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Safra</TableHead>
                <TableHead>Moeda Principal</TableHead>
                <TableHead>Taxa de Câmbio (USD/BRL)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safras.map(safra => {
                const config = configs.find(c => c.safraId === safra.id);
                return (
                  <TableRow key={safra.id}>
                    <TableCell className="font-medium">{safra.nome}</TableCell>
                    <TableCell>
                      <Select
                        value={config?.moedaPrincipal || "BRL"}
                        onValueChange={(value) =>
                          handleMoedaChange(safra.id, value as "BRL" | "USD")
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BRL">R$ (BRL)</SelectItem>
                          <SelectItem value="USD">US$ (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="5.00"
                          value={config?.taxaCambio || 5.00}
                          onChange={(e) =>
                            handleTaxaChange(safra.id, e.target.value)
                          }
                          className="w-24"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-medium mb-1">Como funciona:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Defina a moeda principal para cada safra</li>
              <li>A taxa de câmbio será usada para conversão automática</li>
              <li>Valores podem ser visualizados em ambas as moedas</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Configurações</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}