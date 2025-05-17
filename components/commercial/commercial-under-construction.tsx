"use client";

import { Construction } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CommercialUnderConstruction() {
  return (
    <Card className="border-amber-200 max-w-3xl mx-auto">
      <CardHeader className="bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-3">
          <Construction className="h-8 w-8 text-amber-500" />
          <CardTitle className="text-xl text-amber-800">
            Módulo Comercial em Construção
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="bg-amber-100 p-8 rounded-full">
            <Construction className="h-12 w-12 text-amber-500" />
          </div>

          <div className="space-y-4 max-w-xl">
            <h2 className="text-lg font-medium text-amber-800">
              Estamos trabalhando nesta funcionalidade
            </h2>
            
            <p className="text-gray-600 text-sm">
              O módulo comercial está em desenvolvimento e será disponibilizado em breve.
              Nossa equipe está trabalhando para entregar todas as funcionalidades de gestão
              comercial com a melhor qualidade possível.
            </p>
            
            <p className="text-gray-600 text-sm">
              Retorne em breve para acessar recursos como:
            </p>
            
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Gestão de vendas de sementes</li>
              <li>• Controle financeiro de vendas pecuárias</li>
              <li>• Acompanhamento de preços e commodities</li>
              <li>• Relatórios e análises comerciais</li>
            </ul>
          </div>

          <div className="pt-4">
            <Link href="/dashboard">
              <Button className="bg-amber-600 hover:bg-amber-700">
                Voltar para o Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}