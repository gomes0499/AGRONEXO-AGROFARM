"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, isNegativeValue } from "@/lib/utils/formatters";
import { SeedSale } from "@/schemas/commercial";
import { Culture, Harvest } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import { useFinancialCalculations } from "@/hooks/use-financial-calculations";
import { SalesActionsCell } from "@/components/commercial/common/sales-actions-cell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SeedSalesTableProps {
  sales: SeedSale[];
  onEdit: (sale: SeedSale) => void;
  onDelete: (sale: SeedSale) => void;
  cultures: Culture[];
  properties: Property[];
  harvests: Harvest[];
}

export function SeedSalesTable(props: SeedSalesTableProps) {
  // Extrair props diretamente
  const sales = props.sales || [];
  const onEdit = props.onEdit;
  const onDelete = props.onDelete;
  const cultures = props.cultures || [];
  const properties = props.properties || [];
  const harvests = props.harvests || [];

  // Obter funções de cálculo financeiro
  const financialCalculations = useFinancialCalculations();
  const calculateProfit = financialCalculations.calculateProfit;
  const calculateProfitMargin = financialCalculations.calculateProfitMargin;
  const calculateTotalCosts = financialCalculations.calculateTotalCosts;

  // Helper para obter o nome da cultura
  function getCultureName(cultureId: string): string {
    if (!cultureId) return "Desconhecida";

    for (let i = 0; i < cultures.length; i++) {
      if (cultures[i].id === cultureId) {
        return cultures[i].nome || "Desconhecida";
      }
    }
    return "Desconhecida";
  }

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
          <TableCell colSpan={8} className="h-24 text-center">
            Nenhuma venda de semente encontrada.
          </TableCell>
        </TableRow>
      );
    }

    // Lista para armazenar as linhas renderizadas
    var rows = [];

    // Gerar cada linha com for tradicional em vez de map
    for (var i = 0; i < sales.length; i++) {
      var sale = sales[i];
      if (!sale) continue;

      // Calcular valores financeiros
      var profit = 0;
      var profitMargin = 0;
      var totalCosts = 0;

      // Verificações extras para melhorar a segurança
      try {
        profit = calculateProfit(sale);
        profitMargin = calculateProfitMargin(sale);
        totalCosts = calculateTotalCosts(sale);
      } catch (err) {
        console.error("Erro ao calcular métricas financeiras:", err);
      }

      // Criar a linha da tabela
      var row = (
        <TableRow key={sale.id || i}>
          <TableCell>{getPropertyName(sale.propriedade_id)}</TableCell>
          <TableCell>{getCultureName(sale.cultura_id)}</TableCell>
          <TableCell>{getSafraName(sale.safra_id)}</TableCell>
          <TableCell className="font-medium">
            {formatCurrency(sale.receita_operacional_bruta)}
          </TableCell>
          <TableCell
            className={isNegativeValue(totalCosts) ? "text-red-500" : ""}
          >
            {formatCurrency(totalCosts)}
          </TableCell>
          <TableCell
            className={
              profit > 0
                ? "text-green-600"
                : profit < 0
                ? "text-red-600"
                : "text-gray-600"
            }
          >
            {formatCurrency(profit)}
          </TableCell>
          <TableCell
            className={
              profitMargin > 0
                ? "text-green-600"
                : profitMargin < 0
                ? "text-red-600"
                : "text-gray-600"
            }
          >
            {profitMargin.toFixed(2)}%
          </TableCell>
          <TableCell>
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
          <TableRow>
            <TableHead>Propriedade</TableHead>
            <TableHead>Cultura</TableHead>
            <TableHead>Safra</TableHead>
            <TableHead>Receita Bruta</TableHead>
            <TableHead>Custos Totais</TableHead>
            <TableHead>Lucro Líquido</TableHead>
            <TableHead>Margem (%)</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{renderTableRows()}</TableBody>
      </Table>
    </div>
  );
}
