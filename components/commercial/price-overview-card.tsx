"use client";

import { Price } from "@/schemas/commercial";
import { formatCurrency, formatUsdCurrency } from "@/lib/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";

interface PriceOverviewCardProps {
  price: Price;
}

export function PriceOverviewCard({ price }: PriceOverviewCardProps) {
  // Função para formatar preços para exibição
  const formatPrice = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "N/A";
    return formatCurrency(value);
  };

  // Formatar dólares
  const dollarDate = price.data_referencia
    ? format(new Date(price.data_referencia), "dd/MM/yyyy", { locale: ptBR })
    : "N/A";

  // Formatar nome da safra
  const harvestName = price.safra?.nome ?? "N/A";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Data de Referência</p>
          <p className="font-medium">{dollarDate}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Safra</p>
          <p className="font-medium">{harvestName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bloco de câmbio */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Câmbio</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Dólar Algodão</p>
                <p>{formatPrice(price.dolar_algodao)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Dólar Milho</p>
                <p>{formatPrice(price.dolar_milho)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Dólar Soja</p>
                <p>{formatPrice(price.dolar_soja)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Dólar Fechamento
                </p>
                <p>{formatPrice(price.dolar_fechamento)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco de preços principais */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Preços Principais</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Soja (R$/sc)</p>
                <p>{formatPrice(price.preco_soja_brl)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Soja (US$/sc)</p>
                <p>
                  {price.preco_soja_usd
                    ? formatUsdCurrency(price.preco_soja_usd)
                    : "N/A"}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Milho (R$/sc)</p>
                <p>{formatPrice(price.preco_milho)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Algodão (R$/@)</p>
                <p>{formatPrice(price.preco_algodao_bruto)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco detalhes de algodão */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Detalhes Algodão</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Algodão (US$/lb)
                </p>
                <p>
                  {price.preco_algodao
                    ? formatUsdCurrency(price.preco_algodao, 4)
                    : "N/A"}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Caroço (R$/ton)</p>
                <p>{formatPrice(price.preco_caroco_algodao)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Caroço (R$/@)</p>
                <p>{formatPrice(price.preco_unitario_caroco_algodao)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outros preços */}
      {price.outros_precos && Object.keys(price.outros_precos).length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Outros Preços</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(price.outros_precos).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between bg-muted/30 p-3 rounded-md"
              >
                <p className="text-sm capitalize">{key}</p>
                <p className="font-medium">{formatPrice(value as number)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
