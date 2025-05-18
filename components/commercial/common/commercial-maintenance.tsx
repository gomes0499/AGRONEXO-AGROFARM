"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConstructionIcon, HomeIcon, Wrench } from "lucide-react";
import Link from "next/link";

export interface CommercialMaintenanceProps {
  title?: string;
  description?: string;
  message?: string;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
}

export function CommercialMaintenance({
  title = "Módulo Comercial em Manutenção",
  description = "Este módulo está temporariamente indisponível",
  message = "Nossa equipe está trabalhando para melhorar este módulo. Por favor, tente novamente mais tarde.",
  showHomeButton = true,
  showRetryButton = true,
}: CommercialMaintenanceProps) {
  return (
    <div className="container p-4">
      <Card className="border-amber-200 max-w-3xl mx-auto">
        <CardHeader className="bg-amber-50">
          <div className="flex items-center space-x-2">
            <ConstructionIcon className="h-6 w-6 text-amber-500" />
            <CardTitle className="text-amber-700">{title}</CardTitle>
          </div>
          <CardDescription className="text-amber-600">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="bg-amber-100 p-8 rounded-full">
              <Wrench className="h-12 w-12 text-amber-600" />
            </div>

            <p className="text-gray-700 max-w-lg">{message}</p>

            <p className="text-sm text-gray-500 max-w-md">
              Se o problema persistir, entre em contato com o suporte técnico
              informando o código "COMM-MAINT-01".
            </p>

            <div className="flex flex-wrap gap-4 justify-center mt-4">
              {showHomeButton && (
                <Link href="/dashboard" passHref>
                  <Button variant="outline" className="flex items-center gap-2">
                    <HomeIcon className="h-4 w-4" />
                    Voltar para o Dashboard
                  </Button>
                </Link>
              )}

              {showRetryButton && (
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Tentar Novamente
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
