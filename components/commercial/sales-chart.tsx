"use client";

import { SeedSale, LivestockSale } from "@/schemas/commercial";
import { formatCurrency } from "@/lib/utils/formatters";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps 
} from "recharts";
import { 
  NameType, 
  ValueType 
} from "recharts/types/component/DefaultTooltipContent";

interface SalesChartProps {
  seedSales: SeedSale[];
  livestockSales: LivestockSale[];
}

// Formatação de meses
const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

// Formata os dados para o gráfico de barras
const formatSalesData = (seedSales: SeedSale[], livestockSales: LivestockSale[]) => {
  // Ano atual
  const currentYear = new Date().getFullYear();
  
  // Inicializa o array com os 12 meses
  const monthlyData = MONTHS.map((month, index) => ({
    month,
    monthIndex: index,
    seedSales: 0,
    livestockSales: 0,
    total: 0
  }));
  
  // Filtra as vendas do ano atual
  const currentYearSeedSales = seedSales.filter(sale => sale.ano === currentYear);
  const currentYearLivestockSales = livestockSales.filter(sale => sale.ano === currentYear);
  
  // Agrupa vendas de sementes por mês
  currentYearSeedSales.forEach(sale => {
    // Usando a data de criação para determinar o mês
    const month = new Date(sale.created_at || new Date()).getMonth();
    monthlyData[month].seedSales += sale.receita_operacional_bruta;
    monthlyData[month].total += sale.receita_operacional_bruta;
  });
  
  // Agrupa vendas pecuárias por mês
  currentYearLivestockSales.forEach(sale => {
    // Usando a data de criação para determinar o mês
    const month = new Date(sale.created_at || new Date()).getMonth();
    monthlyData[month].livestockSales += sale.receita_operacional_bruta;
    monthlyData[month].total += sale.receita_operacional_bruta;
  });
  
  // Retorna apenas os meses até o mês atual
  const currentMonth = new Date().getMonth();
  return monthlyData.filter(data => data.monthIndex <= currentMonth);
};

// Componente de tooltip personalizado
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-2 border rounded-md shadow-sm">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name === "seedSales" ? "Sementes" : 
             entry.name === "livestockSales" ? "Pecuária" : "Total"}: {formatCurrency(entry.value as number)}
          </p>
        ))}
      </div>
    );
  }
  
  return null;
};

export function SalesChart({ seedSales, livestockSales }: SalesChartProps) {
  // Formata os dados para o gráfico
  const data = formatSalesData(seedSales, livestockSales);
  
  // Verificar se há dados disponíveis
  if (data.every(item => item.total === 0)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum registro de venda no ano atual
      </div>
    );
  }
  
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 5,
            left: 5,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis 
            tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(value) => {
            if (value === "seedSales") return "Sementes";
            if (value === "livestockSales") return "Pecuária";
            return value;
          }} />
          <Bar dataKey="seedSales" name="seedSales" fill="#0088FE" stackId="a" />
          <Bar dataKey="livestockSales" name="livestockSales" fill="#00C49F" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}