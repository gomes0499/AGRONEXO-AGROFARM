"use client";

import { SeedSale, LivestockSale } from "@/schemas/commercial";
import { formatCurrency } from "@/lib/utils/formatters";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SalesByTypeCardProps {
  seedSales: SeedSale[];
  livestockSales: LivestockSale[];
}

// Cores para o gráfico de pizza
const COLORS = ['#0088FE', '#00C49F'];

export function SalesByTypeCard({ seedSales, livestockSales }: SalesByTypeCardProps) {
  // Calcula totais
  const seedSalesTotal = seedSales.reduce(
    (sum, sale) => sum + sale.receita_operacional_bruta,
    0
  );
  
  const livestockSalesTotal = livestockSales.reduce(
    (sum, sale) => sum + sale.receita_operacional_bruta,
    0
  );
  
  const totalSales = seedSalesTotal + livestockSalesTotal;
  
  // Verifica se há dados disponíveis
  if (totalSales === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum registro de venda disponível
      </div>
    );
  }
  
  // Prepara dados para o gráfico
  const chartData = [
    { 
      name: 'Sementes', 
      value: seedSalesTotal,
      percentage: (seedSalesTotal / totalSales) * 100 
    },
    { 
      name: 'Pecuária', 
      value: livestockSalesTotal,
      percentage: (livestockSalesTotal / totalSales) * 100 
    },
  ];
  
  // Formatação de tooltip personalizada
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Valor: {formatCurrency(data.value)}</p>
          <p className="text-sm">
            {data.percentage.toFixed(1)}% do total
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
        <div className="flex justify-between items-center">
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#0088FE] mr-2"></span>
            Sementes
          </span>
          <span>{formatCurrency(seedSalesTotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#00C49F] mr-2"></span>
            Pecuária
          </span>
          <span>{formatCurrency(livestockSalesTotal)}</span>
        </div>
        <div className="pt-2 border-t flex justify-between font-medium">
          <span>Total</span>
          <span>{formatCurrency(totalSales)}</span>
        </div>
      </div>
    </div>
  );
}