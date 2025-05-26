"use client";

import { formatCurrency, isNegativeValue } from "@/lib/utils/formatters";
import { LivestockSale } from "@/schemas/commercial";
import { Harvest } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import { useFinancialCalculations } from "@/hooks/use-financial-calculations";
import { SalesActionsCell } from "@/components/commercial/common/sales-actions-cell";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LivestockSalesTableProps {
  sales: LivestockSale[];
  onEdit: (sale: LivestockSale) => void;
  onDelete: (sale: LivestockSale) => void;
  properties: Property[];
  harvests: Harvest[];
}

export function LivestockSalesTable({
  sales = [],
  onEdit,
  onDelete,
  properties = [],
  harvests = [],
}: LivestockSalesTableProps) {
  // Obter funções de cálculo financeiro
  const financialCalculations = useFinancialCalculations();
  const calculateProfit = financialCalculations.calculateProfit;
  const calculateProfitMargin = financialCalculations.calculateProfitMargin;
  const calculateTotalCosts = financialCalculations.calculateTotalCosts;

  // Helper para obter o nome da safra a partir do ID
  function getSafraName(safraId: string): string {
    if (!safraId) return "Desconhecida";

    for (let i = 0; i < harvests.length; i++) {
      if (harvests[i].id === safraId) {
        return harvests[i].nome || safraId;
      }
    }
    return safraId;
  }

  // Helper para obter o nome da propriedade a partir do ID
  function getPropertyName(propertyId: string): string {
    if (!propertyId) return "Desconhecida";

    for (let i = 0; i < properties.length; i++) {
      if (properties[i].id === propertyId) {
        return properties[i].nome || "Desconhecida";
      }
    }
    return "Desconhecida";
  }

  // Renderizar linhas da tabela
  function renderTableRows() {
    if (!Array.isArray(sales) || sales.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
            Nenhuma venda pecuária encontrada.
          </TableCell>
        </TableRow>
      );
    }

    // Lista para armazenar as linhas renderizadas
    const rows: React.ReactNode[] = [];

    // Gerar cada linha com for tradicional em vez de map
    for (let i = 0; i < sales.length; i++) {
      let sale = sales[i];
      if (!sale) continue;

      // Calcular valores financeiros
      let profit = 0;
      let profitMargin = 0;
      let totalCosts = 0;

      // Verificações extras para melhorar a segurança
      try {
        profit = calculateProfit(sale);
        profitMargin = calculateProfitMargin(sale);
        totalCosts = calculateTotalCosts(sale);
      } catch (err) {
        console.error("Erro ao calcular métricas financeiras:", err);
      }

      // Criar a linha da tabela
      let row = (
        <TableRow key={sale.id || i}>
          <TableCell>{getPropertyName(sale.propriedade_id)}</TableCell>
          <TableCell>{getSafraName(sale.safra_id)}</TableCell>
          <TableCell className="font-medium">
            {formatCurrency(sale.receita_operacional_bruta)}
          </TableCell>
          <TableCell
            className={isNegativeValue(totalCosts) ? "text-red-500" : ""}
          >
            {formatCurrency(totalCosts)}
          </TableCell>
          <TableCell>
            <Badge variant="default">
              {formatCurrency(profit)}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge variant="default">
              {profitMargin.toFixed(2)}%
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <SalesActionsCell sale={sale} onEdit={onEdit} onDelete={onDelete} />
          </TableCell>
        </TableRow>
      );

      rows.push(row);
    }

    return rows;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Propriedade</TableHead>
            <TableHead className="font-semibold text-primary-foreground">Safra</TableHead>
            <TableHead className="font-semibold text-primary-foreground">Receita Bruta</TableHead>
            <TableHead className="font-semibold text-primary-foreground">Custos Totais</TableHead>
            <TableHead className="font-semibold text-primary-foreground">Lucro Líquido</TableHead>
            <TableHead className="font-semibold text-primary-foreground">Margem (%)</TableHead>
            <TableHead className="text-right font-semibold text-primary-foreground rounded-tr-md">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{renderTableRows()}</TableBody>
      </Table>
    </div>
  );
}
