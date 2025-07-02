"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { fixAllProjectionsWithoutPrices } from "@/lib/actions/fix-projection-prices";

export function FixProjectionsButton() {
  const [isFixing, setIsFixing] = useState(false);

  const handleFix = async () => {
    setIsFixing(true);
    try {
      const result = await fixAllProjectionsWithoutPrices();
      toast.success(result.message);
    } catch (error) {
      toast.error("Erro ao corrigir projeções");
      console.error(error);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-900">Correção Temporária</h3>
          <p className="text-sm text-yellow-800 mt-1">
            Se os preços não foram copiados para os cenários existentes, clique no botão abaixo para corrigir.
          </p>
          <Button
            onClick={handleFix}
            disabled={isFixing}
            className="mt-3"
            variant="outline"
          >
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Corrigindo...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Corrigir Cenários sem Preços
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}