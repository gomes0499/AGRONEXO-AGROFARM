"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from "@/components/ui/alert";
import { initializeDefaultCommodityPrices } from "@/lib/actions/indicator-actions/commodity-price-actions";
import { getSafraCommodityPrices } from "@/lib/actions/indicator-actions/tenant-commodity-actions";

interface CommodityInitializerProps {
  organizationId: string;
  commodityCount: number;
}

export function CommodityInitializer({ 
  organizationId, 
  commodityCount
}: CommodityInitializerProps) {
  const [isInitializing, setIsInitializing] = useState(false);

  // Inicializar commodities apenas quando o botão for clicado
  const handleInitialize = async () => {
    try {
      setIsInitializing(true);
      
      // Usar a função especializada para o tenant GRUPO SAFRA BOA
      // Esta função verifica se já existem preços e cria se necessário
      const commodityPrices = await getSafraCommodityPrices();
      
      if (commodityPrices.length > 0) {
        toast.success("Preços de commodities inicializados com sucesso!");
        // Recarregar a página após inicialização bem-sucedida
        window.location.reload();
      } else {
        toast.error("Não foi possível inicializar os preços de commodities");
      }
    } catch (error: any) {
      toast.error(`Erro inesperado: ${error.message || 'Desconhecido'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  // Se já existem commodities, não exibir nada
  if (commodityCount > 0) {
    return null;
  }

  return (
    <Alert className="mb-6 bg-amber-50 border-amber-200">
      <AlertTitle className="text-amber-800">
        Preços de commodities não encontrados
      </AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mb-4">
          Não foram encontrados preços de commodities cadastrados para sua organização. 
          É necessário inicializar os preços padrão para usar funcionalidades 
          que dependem desses valores.
        </p>
        <Button 
          onClick={handleInitialize} 
          disabled={isInitializing}
          variant="outline"
          className="bg-white border-amber-300 hover:bg-amber-100"
        >
          {isInitializing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Inicializando...
            </>
          ) : (
            'Inicializar Preços Padrão'
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}