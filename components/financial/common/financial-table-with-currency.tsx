"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CurrencyViewToggle } from "@/components/financial/currency-config/currency-view-toggle";
import { formatCurrency } from "@/lib/utils/formatters";
import { convertCurrency } from "@/lib/utils/currency-converter";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FinancialItem {
  id: string;
  nome: string;
  categoria: string;
  moeda: "BRL" | "USD";
  valor: number;
  safra_nome?: string;
  taxa_cambio_safra?: number;
  taxa_cambio_contratacao?: number;
}

interface FinancialTableWithCurrencyProps {
  items: FinancialItem[];
  title: string;
}

export function FinancialTableWithCurrency({
  items,
  title,
}: FinancialTableWithCurrencyProps) {
  const [displayMode, setDisplayMode] = useState<"BRL" | "USD" | "BOTH">("BRL");

  const renderValue = (item: FinancialItem) => {
    const taxaCambio = item.taxa_cambio_contratacao || item.taxa_cambio_safra || 5.00;
    
    if (displayMode === item.moeda) {
      return formatCurrency(item.valor, item.moeda);
    }

    if (displayMode === "BOTH") {
      const valorBRL = item.moeda === "BRL" ? item.valor : convertCurrency(item.valor, "USD", "BRL", taxaCambio);
      const valorUSD = item.moeda === "USD" ? item.valor : convertCurrency(item.valor, "BRL", "USD", taxaCambio);
      
      return (
        <div className="space-y-1">
          <div className={item.moeda === "BRL" ? "font-medium" : "text-muted-foreground text-sm"}>
            {formatCurrency(valorBRL, "BRL")}
          </div>
          <div className={item.moeda === "USD" ? "font-medium" : "text-muted-foreground text-sm"}>
            {formatCurrency(valorUSD, "USD")}
          </div>
        </div>
      );
    }

    // Conversão simples
    const valorConvertido = convertCurrency(item.valor, item.moeda, displayMode, taxaCambio);
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1">
              {formatCurrency(valorConvertido, displayMode)}
              <Info className="h-3 w-3 text-muted-foreground" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <p>Valor original: {formatCurrency(item.valor, item.moeda)}</p>
              <p>Taxa de câmbio: US$ 1,00 = R$ {taxaCambio.toFixed(2)}</p>
              {item.safra_nome && <p>Safra: {item.safra_nome}</p>}
              {item.taxa_cambio_contratacao && (
                <p className="text-yellow-600">Taxa especial de contratação</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Calcular totais
  const totais = {
    BRL: 0,
    USD: 0,
  };

  items.forEach(item => {
    const taxaCambio = item.taxa_cambio_contratacao || item.taxa_cambio_safra || 5.00;
    
    if (item.moeda === "BRL") {
      totais.BRL += item.valor;
      totais.USD += convertCurrency(item.valor, "BRL", "USD", taxaCambio);
    } else {
      totais.USD += item.valor;
      totais.BRL += convertCurrency(item.valor, "USD", "BRL", taxaCambio);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        <CurrencyViewToggle
          currentView={displayMode}
          onViewChange={setDisplayMode}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Moeda Original</TableHead>
            <TableHead>Safra</TableHead>
            <TableHead className="text-right">
              Valor ({displayMode === "BOTH" ? "BRL/USD" : displayMode})
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.nome}</TableCell>
              <TableCell>
                <Badge variant="outline">{item.categoria}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.moeda === "BRL" ? "default" : "secondary"}>
                  {item.moeda}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.safra_nome || "-"}
              </TableCell>
              <TableCell className="text-right">
                {renderValue(item)}
              </TableCell>
            </TableRow>
          ))}
          
          {/* Linha de total */}
          <TableRow className="bg-muted font-medium">
            <TableCell colSpan={4} className="text-right">
              Total
            </TableCell>
            <TableCell className="text-right">
              {displayMode === "BRL" && formatCurrency(totais.BRL, "BRL")}
              {displayMode === "USD" && formatCurrency(totais.USD, "USD")}
              {displayMode === "BOTH" && (
                <div className="space-y-1">
                  <div>{formatCurrency(totais.BRL, "BRL")}</div>
                  <div>{formatCurrency(totais.USD, "USD")}</div>
                </div>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
        <p className="font-medium mb-1">Informações sobre conversão:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Valores são convertidos usando a taxa de câmbio da safra correspondente</li>
          <li>Taxa padrão: US$ 1,00 = R$ 5,00 (quando não especificada)</li>
          <li>Passe o mouse sobre valores convertidos para ver detalhes</li>
        </ul>
      </div>
    </div>
  );
}