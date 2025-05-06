"use client";

import { CommodityStock } from "@/schemas/commercial";
import { formatCurrency } from "@/lib/utils/formatters";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface StockSummaryCardProps {
  stocks: CommodityStock[];
}

// Cores para o gráfico de pizza
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff6b81', '#36A2EB'];

// Função para formatar a commodity para exibição
const formatCommodity = (commodity: string) => {
  const commodityMap: { [key: string]: string } = {
    'SOJA': 'Soja',
    'MILHO': 'Milho',
    'ALGODAO': 'Algodão',
    'ARROZ': 'Arroz',
    'SORGO': 'Sorgo',
    'CAFE': 'Café',
    'CACAU': 'Cacau',
    'SOJA_CANA': 'Soja Cana',
    'OUTROS': 'Outros'
  };
  
  return commodityMap[commodity] || commodity;
};

export function StockSummaryCard({ stocks }: StockSummaryCardProps) {
  if (!stocks || stocks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum estoque de commodity disponível
      </div>
    );
  }
  
  // Agrupa estoques por commodity e soma os valores totais
  const stocksByType = stocks.reduce((acc, stock) => {
    const commodityType = stock.commodity;
    
    if (!acc[commodityType]) {
      acc[commodityType] = {
        name: formatCommodity(commodityType),
        value: 0,
        quantity: 0
      };
    }
    
    acc[commodityType].value += stock.valor_total;
    acc[commodityType].quantity += stock.quantidade;
    
    return acc;
  }, {} as Record<string, { name: string; value: number; quantity: number }>);
  
  // Converte para array para o gráfico
  const chartData = Object.values(stocksByType)
    .sort((a, b) => b.value - a.value); // Ordena por valor decrescente
  
  // Calcular valor total
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Formatação de tooltip personalizada
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Valor: {formatCurrency(data.value)}</p>
          <p className="text-sm">
            {((data.value / totalValue) * 100).toFixed(1)}% do total
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="space-y-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Valor Total em Estoque:</span>
          <span>{formatCurrency(totalValue)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium">Número de Commodities:</span>
          <span>{chartData.length}</span>
        </div>
      </div>
    </div>
  );
}