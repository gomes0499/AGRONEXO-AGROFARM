"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createDefaultPricesConfiguration } from "@/lib/actions/production-prices-default-data";
import { toast } from "sonner";

interface CreateDefaultPricesButtonProps {
  organizationId: string;
  hasExistingData: boolean;
}

export function CreateDefaultPricesButton({ 
  organizationId, 
  hasExistingData 
}: CreateDefaultPricesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    
    try {
      const result = await createDefaultPricesConfiguration(organizationId);
      
      if (result.success) {
        toast.success(result.message || "Configuração padrão criada com sucesso!");
        setIsOpen(false);
      } else {
        toast.error(result.error || "Erro ao criar configuração padrão");
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao criar a configuração padrão");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
        size="sm"
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Configuração Padrão
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Criar Configuração Padrão de Preços</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 mt-4">
              {hasExistingData ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Atenção!</AlertTitle>
                  <AlertDescription>
                    Já existem dados de preços cadastrados. Esta ação irá adicionar apenas os preços 
                    que ainda não foram configurados, sem sobrescrever os existentes.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Configuração Inicial</AlertTitle>
                  <AlertDescription>
                    Esta ação criará uma configuração inicial com preços padrão de mercado para as 
                    principais commodities e taxas de câmbio.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Commodities incluídas:</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Soja Sequeiro - R$/saca</li>
                    <li>• Soja Irrigado - R$/saca</li>
                    <li>• Milho Sequeiro - R$/saca</li>
                    <li>• Algodão (capulho) - R$/@</li>
                    <li>• Arroz Irrigado - R$/saca</li>
                    <li>• Sorgo - R$/saca</li>
                    <li>• Feijão - R$/saca</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Taxas de câmbio incluídas:</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Dólar Algodão (30/09)</li>
                    <li>• Dólar Soja (31/05)</li>
                    <li>• Dólar Fechamento (31/12)</li>
                  </ul>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Importante:</strong> As safras devem estar cadastradas previamente para 
                    que os preços sejam associados corretamente.
                  </AlertDescription>
                </Alert>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreate} disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Configuração"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}