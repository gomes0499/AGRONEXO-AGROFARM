"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

export default function PropertyDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-50 shadow-sm border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Área Total</h3>
            <p className="text-2xl font-bold mt-1">83,90 ha</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="text-sm font-medium text-gray-500">
              Área Cultivável
            </h3>
            <p className="text-2xl font-bold mt-1 text-green-600">65,84 ha</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 shadow-sm border-blue-100">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Reserva Legal</h3>
            <p className="text-2xl font-bold mt-1 text-blue-600">4,58 ha</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 shadow-sm border-amber-100">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Cultivo Ativo</h3>
            <p className="text-2xl font-bold mt-1 text-amber-600">42,78 ha</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <Badge variant="outline" className="mb-2">
                Status: ATIVO
              </Badge>
              <h2 className="text-xl font-bold">Fazenda Alvorada X</h2>
              <div className="flex items-center text-gray-500 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>Wanderley, BA</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Condição: -</p>
              <p className="text-sm text-gray-500">CRI: 232142</p>
              <p className="text-sm text-gray-500">Matrícula: 12345</p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Área Total
                </h3>
                <p className="text-xl font-semibold">83,90 ha</p>
                <p className="text-xs text-gray-500">0,00 módulos fiscais</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Reserva Legal
                </h3>
                <p className="text-lg">4,58 ha</p>
                <p className="text-xs text-gray-500">5,46% da área total</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Recursos Hídricos
                </h3>
                <p className="text-lg">2,43 ha</p>
                <p className="text-xs text-gray-500">2,90% da área total</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Área Protegida Total
                </h3>
                <p className="text-lg">29,09 ha</p>
                <p className="text-xs text-gray-500">34,68% da área total</p>
              </div>
            </div>

            <div className="mt-4 md:mt-0">
              <h3 className="text-sm font-medium text-gray-500">
                Informações do CAR
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Código CAR:{" "}
                <span className="font-medium">
                  BA-2933455-07DE4C04FC994BAC9D2A3ABE19C0A6B1
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Criado em: -</p>
              <p className="text-xs text-gray-500 mt-1">Atualizado em: -</p>
              <p className="text-xs text-gray-500 mt-1">Tipo: RURAL</p>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Áreas Agricultáveis
                </h3>
                <p className="text-lg font-semibold text-green-600 mt-1">
                  Área Cultivável: 65,84 ha
                </p>
                <p className="text-xs text-gray-500">78,48% da área total</p>
                <p className="text-xs text-gray-500 mt-1 italic">
                  (Cálculo: Área total - (RL + APP + Uso Restrito + Vegetação
                  Nativa))
                </p>

                <p className="text-lg mt-2">
                  <span className="font-medium">Cultivo Ativo:</span> 42,78 ha
                </p>
                <p className="text-xs text-gray-500">50,99% da área total</p>

                <p className="text-lg mt-2">
                  <span className="font-medium">Em Pousio:</span> 13,59 ha
                </p>
                <p className="text-xs text-gray-500">16,20% da área total</p>

                <div className="mt-2 text-xs text-gray-500">
                  <p>Percentual de ocupação: 67,19%</p>
                  <p>Área cultivável: 54,81 ha</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
