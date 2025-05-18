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

export function SeedSalesTable({
  sales,
  onEdit,
  onDelete,
  cultures,
  properties,
  harvests,
}: SeedSalesTableProps) {
  const {
    calculateProfit,
    calculateProfitMargin,
    calculateTotalCosts,
  } = useFinancialCalculations();

  // Helper para obter o nome da cultura
  const getCultureName = (cultureId: string) => {
    const culture = cultures.find((c) => c.id === cultureId);
    return culture ? culture.nome : "Desconhecida";
  };

  // Helper para obter o nome da safra a partir do ID
  const getSafraName = (safraId: string) => {
    const safra = harvests.find((h) => h.id === safraId);
    return safra ? safra.nome : safraId;
  };

  // Helper para obter o nome da propriedade a partir do ID
  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    return property ? property.nome : "Desconhecida";
  };

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
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                Nenhuma venda de semente encontrada.
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => {
              const profit = calculateProfit(sale);
              const profitMargin = calculateProfitMargin(sale);
              const totalCosts = calculateTotalCosts(sale);

              return (
                <TableRow key={sale.id}>
                  <TableCell>{getPropertyName(sale.propriedade_id)}</TableCell>
                  <TableCell>{getCultureName(sale.cultura_id)}</TableCell>
                  <TableCell>{getSafraName(sale.safra_id)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(sale.receita_operacional_bruta)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      isNegativeValue(totalCosts) && "text-red-500"
                    )}
                  >
                    {formatCurrency(totalCosts)}
                  </TableCell>
                  <TableCell
                    className={cn({
                      "text-green-600": profit > 0,
                      "text-red-600": profit < 0,
                      "text-gray-600": profit === 0,
                    })}
                  >
                    {formatCurrency(profit)}
                  </TableCell>
                  <TableCell
                    className={cn({
                      "text-green-600": profitMargin > 0,
                      "text-red-600": profitMargin < 0,
                      "text-gray-600": profitMargin === 0,
                    })}
                  >
                    {profitMargin.toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <SalesActionsCell
                      sale={sale}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}