"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Warehouse, Package, Wheat, TrendingUp } from "lucide-react";
import { getStorages } from "@/lib/actions/storage-actions";
import { formatNumber } from "@/lib/utils/formatters";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface StorageStatsProps {
  organizationId: string;
  projectionId?: string;
}

export function StorageStats({ organizationId }: StorageStatsProps) {
  const [storages, setStorages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      const data = await getStorages(organizationId);
      setStorages(data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Carregando estatísticas...</div>
      </div>
    );
  }

  // Calcular estatísticas
  const totalSacas = storages
    .filter(s => s.tipo_armazenagem === 'graos')
    .reduce((sum, s) => sum + (s.capacidade_sacas || 0), 0);

  const totalFardos = storages
    .filter(s => s.tipo_armazenagem === 'algodao')
    .reduce((sum, s) => sum + (s.capacidade_fardos || 0), 0);

  const totalArmazensGraos = storages.filter(s => s.tipo_armazenagem === 'graos').length;
  const totalArmazensAlgodao = storages.filter(s => s.tipo_armazenagem === 'algodao').length;
  const totalComBeneficiamento = storages.filter(s => s.possui_beneficiamento).length;

  // Dados para gráfico de pizza
  const pieData = [
    { name: 'Grãos', value: totalArmazensGraos, color: '#10b981' },
    { name: 'Algodão', value: totalArmazensAlgodao, color: '#3b82f6' },
  ];

  // Dados para gráfico de barras por propriedade
  const barData = storages.reduce((acc: any[], storage) => {
    const existing = acc.find(item => item.propriedade === storage.propriedade_nome);
    
    if (existing) {
      if (storage.tipo_armazenagem === 'graos') {
        existing.graos += storage.capacidade_sacas || 0;
      } else {
        existing.algodao += storage.capacidade_fardos || 0;
      }
    } else {
      acc.push({
        propriedade: storage.propriedade_nome || 'Propriedade',
        graos: storage.tipo_armazenagem === 'graos' ? (storage.capacidade_sacas || 0) : 0,
        algodao: storage.tipo_armazenagem === 'algodao' ? (storage.capacidade_fardos || 0) : 0,
      });
    }
    
    return acc;
  }, []);

  // Conversão para toneladas
  const toneladasGraos = (totalSacas * 60) / 1000; // Assumindo saca de 60kg
  const toneladasAlgodao = (totalFardos * 227) / 1000; // Fardo de 227kg

  return (
    <div className="p-6 space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Capacidade Total Grãos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalSacas)}</div>
            <p className="text-xs text-muted-foreground">
              sacas ({formatNumber(toneladasGraos)} ton)
            </p>
            <div className="flex items-center mt-2 text-xs">
              <Wheat className="h-3 w-3 mr-1" />
              {totalArmazensGraos} armazéns
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Capacidade Total Algodão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalFardos)}</div>
            <p className="text-xs text-muted-foreground">
              fardos ({formatNumber(toneladasAlgodao)} ton)
            </p>
            <div className="flex items-center mt-2 text-xs">
              <Package className="h-3 w-3 mr-1" />
              {totalArmazensAlgodao} armazéns
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Armazéns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storages.length}</div>
            <p className="text-xs text-muted-foreground">unidades</p>
            <div className="flex items-center mt-2 text-xs">
              <Warehouse className="h-3 w-3 mr-1" />
              {totalComBeneficiamento} com beneficiamento
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Beneficiamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {storages.length > 0 
                ? Math.round((totalComBeneficiamento / storages.length) * 100)
                : 0
              }%
            </div>
            <Progress 
              value={storages.length > 0 ? (totalComBeneficiamento / storages.length) * 100 : 0} 
              className="mt-2"
            />
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              {totalComBeneficiamento} de {storages.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacidade por Propriedade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="propriedade" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="graos" fill="#10b981" name="Grãos (sacas)" />
                  <Bar dataKey="algodao" fill="#3b82f6" name="Algodão (fardos)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhada por propriedade */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Propriedade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {barData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{item.propriedade}</p>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    {item.graos > 0 && (
                      <span className="flex items-center gap-1">
                        <Wheat className="h-3 w-3" />
                        {formatNumber(item.graos)} sacas
                      </span>
                    )}
                    {item.algodao > 0 && (
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {formatNumber(item.algodao)} fardos
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Capacidade Total</p>
                  <p className="font-bold">
                    {formatNumber((item.graos * 60 + item.algodao * 227) / 1000)} ton
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}