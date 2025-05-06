"use client";

import { Price } from "@/schemas/commercial";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Extended price interface that includes the joined safra data
interface PriceWithSafra extends Price {
  safra?: {
    id?: string;
    nome?: string;
    ano_inicio?: number;
    ano_fim?: number;
    organizacao_id?: string;
  };
}

interface PriceOverviewCardProps {
  price: PriceWithSafra;
}

export function PriceOverviewCard({ price }: PriceOverviewCardProps) {
  if (!price) return null;
  
  // Formata a data para exibição
  const formattedDate = price.data_referencia 
    ? format(new Date(price.data_referencia), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "Data não disponível";
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Preços de referência - {formattedDate}
        </span>
        <span className="text-sm font-medium">
          Safra: {price.safra?.nome || "N/A"}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Cotações de Soja */}
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-2">Soja</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">R$/saca:</span>
                <span className="text-sm font-medium">
                  {price.preco_soja_brl ? formatCurrency(price.preco_soja_brl) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">US$/saca:</span>
                <span className="text-sm font-medium">
                  {price.preco_soja_usd ? `$${price.preco_soja_usd.toFixed(2)}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dólar:</span>
                <span className="text-sm font-medium">
                  {price.dolar_soja ? formatCurrency(price.dolar_soja) : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Cotações de Milho */}
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-2">Milho</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">R$/saca:</span>
                <span className="text-sm font-medium">
                  {price.preco_milho ? formatCurrency(price.preco_milho) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dólar:</span>
                <span className="text-sm font-medium">
                  {price.dolar_milho ? formatCurrency(price.dolar_milho) : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Cotações de Algodão */}
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-2">Algodão</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">US$/lb:</span>
                <span className="text-sm font-medium">
                  {price.preco_algodao ? `$${price.preco_algodao.toFixed(4)}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">R$/@:</span>
                <span className="text-sm font-medium">
                  {price.preco_algodao_bruto ? formatCurrency(price.preco_algodao_bruto) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dólar:</span>
                <span className="text-sm font-medium">
                  {price.dolar_algodao ? formatCurrency(price.dolar_algodao) : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Informações de Caroço de Algodão e Dólar Fechamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-2">Caroço de Algodão</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">R$/ton:</span>
                <span className="text-sm font-medium">
                  {price.preco_caroco_algodao ? formatCurrency(price.preco_caroco_algodao) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">R$/@:</span>
                <span className="text-sm font-medium">
                  {price.preco_unitario_caroco_algodao ? formatCurrency(price.preco_unitario_caroco_algodao) : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-2">Dólar (Fechamento)</h4>
            <div className="text-2xl font-bold">
              {price.dolar_fechamento ? formatCurrency(price.dolar_fechamento) : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Outros Preços */}
      {price.outros_precos && Object.keys(price.outros_precos).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-2">Outras Commodities</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(price.outros_precos).map(([commodity, value]) => (
                <div key={commodity} className="flex justify-between">
                  <span className="text-sm text-muted-foreground capitalize">
                    {commodity}:
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}