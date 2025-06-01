"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { PercentIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
} from "@/components/ui/chart";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatPercent } from "@/lib/utils/formatters";
import { Loader2 } from "lucide-react";

interface FinancialDebtTypeDistributionProps {
  organizationId: string;
  selectedYear?: number | string;
}

interface DebtTypeData {
  name: string;
  value: number;
  percentual: number;
  color: string;
}

const COLORS = ["#1B124E", "#4338CA", "#6366F1", "#818CF8"];

const chartConfig = {
  valor: {
    label: "Valor da Dívida",
    color: "#1B124E",
  },
} satisfies ChartConfig;

async function getDebtTypeDistributionData(organizationId: string, yearOrSafraId?: number | string): Promise<{ data: DebtTypeData[], yearUsed: number, safraName?: string }> {
  const supabase = createClient();
  
  console.log(`Solicitado: ${yearOrSafraId}, Tipo: ${typeof yearOrSafraId}`);
  
  // Busca todas as dívidas bancárias
  const { data: dividasBancarias } = await supabase
    .from('dividas_bancarias')
    .select('*')
    .eq('organizacao_id', organizationId);

  if (!dividasBancarias || dividasBancarias.length === 0) {
    return { data: [], yearUsed: new Date().getFullYear() };
  }

  // Busca todas as safras disponíveis
  const { data: safras } = await supabase
    .from('safras')
    .select('id, nome, ano_inicio, ano_fim')
    .eq('organizacao_id', organizationId)
    .order('ano_inicio', { ascending: false });
  
  if (!safras || safras.length === 0) {
    console.log('Nenhuma safra encontrada');
    return { data: [], yearUsed: new Date().getFullYear() };
  }

  // Determinar qual safra usar
  let safraAtualId: string | undefined;
  let safraAtualNome: string | undefined;
  let anoExibido: number = new Date().getFullYear();
  
  // Se yearOrSafraId for uma string que não é um número e tem comprimento de UUID (36 caracteres)
  if (typeof yearOrSafraId === 'string' && yearOrSafraId.length >= 30) {
    // É provavelmente um ID de safra
    safraAtualId = yearOrSafraId;
    const safraEncontrada = safras.find(s => s.id === safraAtualId);
    if (safraEncontrada) {
      safraAtualNome = safraEncontrada.nome;
      anoExibido = safraEncontrada.ano_inicio;
      console.log(`Usando safra pelo ID: ${safraAtualId} (${safraAtualNome}), ano: ${anoExibido}`);
    } else {
      // Se não encontrou a safra, usar a mais recente
      safraAtualId = safras[0].id;
      safraAtualNome = safras[0].nome;
      anoExibido = safras[0].ano_inicio;
      console.log(`Safra não encontrada, usando mais recente: ${safraAtualId} (${safraAtualNome}), ano: ${anoExibido}`);
    }
  } 
  // Se yearOrSafraId for um número válido (ano)
  else if (typeof yearOrSafraId === 'number' && yearOrSafraId >= 2000 && yearOrSafraId <= 2100) {
    // É um ano válido, buscar a safra correspondente
    anoExibido = yearOrSafraId;
    const safraEncontrada = safras.find(s => s.ano_inicio === yearOrSafraId);
    if (safraEncontrada) {
      safraAtualId = safraEncontrada.id;
      safraAtualNome = safraEncontrada.nome;
      console.log(`Usando safra pelo ano: ${anoExibido}, safra: ${safraAtualNome} (${safraAtualId})`);
    } else {
      // Se não encontrou safra para este ano, usar a mais recente
      safraAtualId = safras[0].id;
      safraAtualNome = safras[0].nome;
      console.log(`Nenhuma safra encontrada para o ano ${anoExibido}, usando mais recente: ${safraAtualNome} (${safraAtualId})`);
    }
  } 
  // Caso contrário, usar a safra mais recente
  else {
    safraAtualId = safras[0].id;
    safraAtualNome = safras[0].nome;
    anoExibido = safras[0].ano_inicio;
    console.log(`Usando safra mais recente: ${safraAtualId} (${safraAtualNome}), ano: ${anoExibido}`);
  }
  
  console.log(`Safra escolhida para exibição: ${safraAtualId} (${safraAtualNome})`);
  
  // Verificar quais safras têm dados de dívidas
  const safrasComDados = new Set<string>();
  
  dividasBancarias.forEach(divida => {
    let valores = divida.valores_por_ano;
    if (typeof valores === 'string') {
      try {
        valores = JSON.parse(valores);
      } catch (e) {
        valores = {};
      }
    }
    
    if (valores && typeof valores === 'object') {
      Object.keys(valores).forEach(chave => {
        if (valores[chave] > 0) {
          safrasComDados.add(chave);
        }
      });
    }
  });
  
  console.log(`Safras com dados: ${Array.from(safrasComDados).join(', ')}`);
  
  // Se a safra escolhida não tem dados, procurar outra safra
  if (safraAtualId && !safrasComDados.has(safraAtualId)) {
    console.log(`A safra escolhida ${safraAtualId} não tem dados`);
    
    // Verificar se alguma safra tem dados
    if (safrasComDados.size > 0) {
      const safraIdComDados = Array.from(safrasComDados)[0];
      const safraComDados = safras.find(s => s.id === safraIdComDados);
      
      if (safraComDados) {
        safraAtualId = safraComDados.id;
        safraAtualNome = safraComDados.nome;
        anoExibido = safraComDados.ano_inicio;
        console.log(`Usando safra alternativa com dados: ${safraAtualId} (${safraAtualNome}), ano: ${anoExibido}`);
      }
    } else {
      // Se não há nenhuma safra com dados, mantemos a seleção atual,
      // mas podemos mostrar uma mensagem de "sem dados"
      console.log(`Nenhuma safra com dados de dívidas bancárias encontrada`);
    }
  }
  
  // Inicializar totais por modalidade
  const totalPorModalidade: Record<string, number> = {
    CUSTEIO: 0,
    INVESTIMENTOS: 0
  };
  
  // Processar cada dívida bancária
  dividasBancarias.forEach(divida => {
    const modalidade = divida.modalidade || "OUTROS";
    
    // Verifica se valores_por_ano existe e processa
    let valores = divida.valores_por_ano;
    if (typeof valores === 'string') {
      try {
        valores = JSON.parse(valores);
      } catch (e) {
        console.error("Erro ao parsear valores_por_ano:", e);
        valores = {};
      }
    }
    
    // Busca o valor para a safra escolhida
    let valorSafra = 0;
    
    if (valores && typeof valores === 'object' && safraAtualId) {
      valorSafra = valores[safraAtualId] || 0;
      
      // Se não encontrou pelo ID exato, tenta encontrar por algum ID que corresponda parcialmente
      if (valorSafra === 0 && safraAtualId.length >= 8) {
        const safraIdPrefix = safraAtualId.substring(0, 8); // Primeiros 8 caracteres
        
        Object.keys(valores).forEach(chave => {
          if (chave.includes(safraIdPrefix) && valores[chave] > 0) {
            valorSafra = valores[chave];
            console.log(`Encontrado valor usando correspondência parcial de ID: ${chave} -> ${valorSafra}`);
          }
        });
      }
    }
    
    // Se ainda não encontrou valor, tenta usar o ano da safra como chave
    if (valorSafra === 0 && anoExibido) {
      const anoStr = anoExibido.toString();
      if (valores && valores[anoStr] > 0) {
        valorSafra = valores[anoStr];
        console.log(`Encontrado valor usando ano: ${anoStr} -> ${valorSafra}`);
      }
    }
    
    // Se ainda não tem valor e há um campo de valor_total, usa o valor total
    if (valorSafra === 0 && divida.valor_total) {
      valorSafra = divida.valor_total;
      console.log(`Usando valor_total para dívida de modalidade ${modalidade}: ${valorSafra}`);
    }
    
    // Acumula o valor na modalidade correspondente se for maior que zero
    if (valorSafra > 0) {
      if (modalidade === "CUSTEIO" || modalidade === "INVESTIMENTOS") {
        totalPorModalidade[modalidade] += valorSafra;
      } else {
        // Para outras modalidades, considerar como INVESTIMENTOS
        totalPorModalidade["INVESTIMENTOS"] += valorSafra;
      }
    }
  });

  // Calcular total geral
  const totalGeral = Object.values(totalPorModalidade).reduce((sum, valor) => sum + valor, 0);
  
  if (totalGeral === 0) {
    return { data: [], yearUsed: anoExibido, safraName: safraAtualNome };
  }

  // Criar array de dados para o gráfico com percentuais corretos
  const data: DebtTypeData[] = [
    {
      name: "Custeio",
      value: totalPorModalidade.CUSTEIO,
      percentual: totalPorModalidade.CUSTEIO / totalGeral,
      color: COLORS[0]
    },
    {
      name: "Investimentos",
      value: totalPorModalidade.INVESTIMENTOS,
      percentual: totalPorModalidade.INVESTIMENTOS / totalGeral,
      color: COLORS[1]
    }
  ].filter(item => item.value > 0);

  return { data, yearUsed: anoExibido, safraName: safraAtualNome };
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-background dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm dark:text-white">{data.name}</p>
        <div className="my-1 h-px bg-border dark:bg-gray-600" />
        <div className="space-y-1 mt-2">
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground dark:text-gray-400">Valor:</span> 
            <span className="font-medium dark:text-white">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground dark:text-gray-400">Participação:</span> 
            <span className="font-medium dark:text-white">{formatPercent(data.percentual)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function FinancialDebtTypeDistributionChart({ 
  organizationId, 
  selectedYear 
}: FinancialDebtTypeDistributionProps) {
  const [data, setData] = useState<DebtTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayYear, setDisplayYear] = useState<number>(selectedYear && typeof selectedYear === 'number' ? selectedYear : new Date().getFullYear());
  const [displaySafra, setDisplaySafra] = useState<string | undefined>(undefined);
  const [requestedYearOrSafraId, setRequestedYearOrSafraId] = useState<number | string>(selectedYear || new Date().getFullYear());

  // Efeito para atualizar o valor solicitado quando o selectedYear mudar
  useEffect(() => {
    console.log(`Valor recebido de selectedYear: ${selectedYear}, tipo: ${typeof selectedYear}`);
    
    if (selectedYear) {
      console.log(`Atualizando requisição para: ${selectedYear}`);
      setRequestedYearOrSafraId(selectedYear);
    } else {
      // Se não houver seleção, usar o ano atual
      console.log(`Nenhum valor selecionado, usando ano atual`);
      setRequestedYearOrSafraId(new Date().getFullYear());
    }
  }, [selectedYear]);

  // Efeito para carregar dados quando o valor solicitado ou organização mudar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Carregando dados de distribuição de modalidades para ano/safra: ${requestedYearOrSafraId}`);
        
        const result = await getDebtTypeDistributionData(organizationId, requestedYearOrSafraId);
        
        // Usar o ano real e o nome da safra encontrados nos dados
        const { data: typeData, yearUsed, safraName } = result;
        console.log(`Dados carregados: ${typeData.length} modalidades encontradas para safra ${safraName} (ano ${yearUsed})`);
        
        setData(typeData);
        setDisplayYear(yearUsed);
        setDisplaySafra(safraName);
      } catch (err) {
        console.error("Erro ao carregar dados de distribuição por modalidade:", err);
        setError("Erro ao carregar gráfico de distribuição por modalidade");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId, requestedYearOrSafraId]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <PercentIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Distribuição de Dívidas
                </CardTitle>
                <CardDescription className="text-white/80">
                  Carregando dados...
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Carregando dados...
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <PercentIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Distribuição de Dívidas
                </CardTitle>
                <CardDescription className="text-white/80">
                  {error}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <PercentIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Distribuição de Dívidas {displaySafra ? `(${displaySafra})` : `(${displayYear})`}
                </CardTitle>
                <CardDescription className="text-white/80">
                  Custeio vs Investimentos
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex flex-col items-center justify-center">
            <div className="text-muted-foreground mb-4">
              Nenhuma dívida bancária encontrada para a safra {displaySafra || displayYear}
            </div>
            <div className="text-center text-sm text-muted-foreground max-w-md">
              Para visualizar este gráfico, cadastre dívidas bancárias no módulo financeiro 
              e defina valores para a safra selecionada.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular estatísticas
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maiorCategoria = data.reduce((maior, atual) => 
    atual.value > maior.value ? atual : maior, data[0]);

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <PercentIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Dívidas: Custeio vs Investimentos {displaySafra ? `(${displaySafra})` : `(${displayYear})`}
              </CardTitle>
              <CardDescription className="text-white/80">
                Distribuição das dívidas bancárias por modalidade
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="w-full h-[350px] sm:h-[400px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${formatPercent(percent)}`}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value, entry, index) => {
                    if (entry && entry.payload) {
                      // Convert to unknown first, then to our expected type
                      const payload = entry.payload as unknown as DebtTypeData;
                      if (payload.name && typeof payload.percentual === 'number') {
                        return <span className="text-sm dark:text-white">{payload.name} ({formatPercent(payload.percentual)})</span>;
                      }
                    }
                    return <span className="text-sm dark:text-white">{value}</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      {/* Footer com estatísticas */}
      <div className="p-4 bg-muted/30 rounded-b-lg text-sm">
        <p className="text-center font-medium dark:text-white">
          Total de dívidas: {formatCurrency(total)}
          <span className="mx-2">•</span>
          <span>
            Custeio: {formatPercent(data.find(d => d.name === "Custeio")?.percentual || 0)}
            <span className="mx-1">-</span>
            Investimentos: {formatPercent(data.find(d => d.name === "Investimentos")?.percentual || 0)}
          </span>
        </p>
      </div>
    </Card>
  );
}