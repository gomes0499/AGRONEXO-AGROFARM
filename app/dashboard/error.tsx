"use client";

import { useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, HomeIcon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";

export default function DashboardErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro no console ou em um serviço de monitoramento
    console.error("Erro no dashboard:", error);
  }, [error]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="border-red-200">
        <CardHeader className="bg-red-50">
          <div className="flex items-center space-x-2">
            <AlertTriangleIcon className="h-6 w-6 text-red-500" />
            <CardTitle className="text-red-700">Erro no Dashboard</CardTitle>
          </div>
          <CardDescription className="text-red-600">
            Ocorreu um problema ao carregar esta página
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="bg-red-100 p-6 rounded-full">
              <AlertTriangleIcon className="h-12 w-12 text-red-600" />
            </div>
            
            <p className="text-gray-700 max-w-lg">
              Estamos enfrentando dificuldades técnicas ao carregar esta página. 
              Nossa equipe já foi notificada e está trabalhando para resolver o problema.
            </p>
            
            <p className="text-sm text-gray-500 max-w-md">
              Se o problema persistir, entre em contato com o suporte técnico 
              informando o código de erro: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{error.digest || "DASH-ERR"}</span>
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <Link href="/dashboard" passHref>
                <Button variant="outline" className="flex items-center gap-2">
                  <HomeIcon className="h-4 w-4" />
                  Voltar para o Dashboard
                </Button>
              </Link>
              
              <Button 
                onClick={() => reset()}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <RefreshCwIcon className="h-4 w-4" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}