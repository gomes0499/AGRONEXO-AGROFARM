"use client";

import { useState, useEffect } from "react";
import { LayoutList, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

// Formatar valor monetário
function formatCurrency(value: number, digits = 2) {
  let formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: value >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: digits,
  }).format(value);

  // Adicionar espaço entre o número e a unidade (mi, bi)
  formatted = formatted.replace(/mi$/, " mi").replace(/bi$/, " bi");

  return formatted;
}

interface FinancialTotalLiabilitiesChartProps {
  organizationId: string;
  selectedYear?: number | string;
}

interface LiabilityData {
  safra: string;
  bancos_tradings: number;
  outros: number;
  total: number;
  liquido: number;
}

const chartConfig = {
  total: {
    label: "Dívida Total",
    color: "#1B124E", // Tom primário mais escuro
  },
  liquido: {
    label: "Dívida Líquida",
    color: "#4338CA", // Tom secundário
  },
  bancos_tradings: {
    label: "Dívida Bancária",
    color: "#6366F1", // Tom terciário
  },
  outros: {
    label: "Outros Passivos",
    color: "#818CF8", // Tom quaternário
  },
} satisfies ChartConfig;

async function getTotalLiabilitiesData(
  organizationId: string,
  yearOrSafraId?: number | string
): Promise<{ data: LiabilityData[]; safraName?: string }> {
  const supabase = createClient();

  const { data: safras } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("organizacao_id", organizationId)
    .order("ano_inicio"); // Ordenar por ano de início em ordem crescente

  if (!safras || safras.length === 0) {
    return { data: [] };
  }

  // Filtramos safras a partir de 2020/2021 até o presente
  // Queremos mostrar a evolução histórica completa dos passivos
  const safrasFiltradas = safras.filter((safra) => {
    // Pegar o ano de início da safra (primeiro número da string nome)
    const anoInicio = parseInt(safra.nome.split("/")[0]);
    return anoInicio >= 2020; // Incluir safras de 2020 em diante
  });

  // Usar todas as safras filtradas para o gráfico
  const safrasParaAnalisar = safrasFiltradas.map((s) => s.id);

  // Também identificamos a safra atualmente selecionada para destacar, se houver
  let safraAtualNome: string | undefined;

  if (typeof yearOrSafraId === "string" && yearOrSafraId.length >= 30) {
    const safraEncontrada = safras.find((s) => s.id === yearOrSafraId);
    if (safraEncontrada) {
      safraAtualNome = safraEncontrada.nome;
    }
  } else if (
    typeof yearOrSafraId === "number" &&
    yearOrSafraId >= 2000 &&
    yearOrSafraId <= 2100
  ) {
    const safraEncontrada = safras.find((s) => s.ano_inicio === yearOrSafraId);
    if (safraEncontrada) {
      safraAtualNome = safraEncontrada.nome;
    }
  }

  const [dividasBancariasResult, caixaDisponibilidadesResult] =
    await Promise.all([
      // Dívidas bancárias (inclui bancos, tradings e outros)
      supabase
        .from("dividas_bancarias")
        .select("*")
        .eq("organizacao_id", organizationId),
      // Caixa e disponibilidades
      supabase
        .from("caixa_disponibilidades")
        .select("*")
        .eq("organizacao_id", organizationId),
    ]);

  const dividasBancarias = dividasBancariasResult.data || [];
  const caixaDisponibilidades = caixaDisponibilidadesResult.data || [];

  // Inicializar resultado
  const resultado: LiabilityData[] = [];

  // Inicializar estrutura para armazenar os valores por safra
  const valoresPorSafra: Record<
    string,
    {
      bancos: number;
      outros: number;
      caixa: number;
      arrendamento: number;
      fornecedores: number;
      tradings: number;
      estoqueCommodity: number;
      estoqueInsumos: number;
      ativoBiologico: number;
    }
  > = {};

  // Inicializar o objeto para cada safra
  for (const safraId of safrasParaAnalisar) {
    valoresPorSafra[safraId] = {
      bancos: 0,
      outros: 0,
      caixa: 0,
      arrendamento: 0,
      fornecedores: 0,
      tradings: 0,
      estoqueCommodity: 0,
      estoqueInsumos: 0,
      ativoBiologico: 0,
    };
  }

  // Função auxiliar para extrair valores de um campo JSON
  const extrairValorSafra = (
    objeto: any,
    safraId: string,
    campoValores = "valores_por_safra"
  ): number => {
    try {
      let valores = objeto[campoValores] || objeto.valores_por_ano || {};

      if (typeof valores === "string") {
        valores = JSON.parse(valores);
      }

      if (valores && typeof valores === "object") {
        return parseFloat(valores[safraId]) || 0;
      }
    } catch (e) {
      console.warn("Erro ao extrair valor:", e);
    }
    return 0;
  };

  // Vamos buscar o total de dívidas global (bancos e outros)
  let totalBancosTodos = 0;
  let totalOutrosTodos = 0;

  // Somar todos os valores de dívidas bancárias globalmente
  for (const divida of dividasBancarias) {
    // Para cada dívida, somar todos os valores de todas as safras
    let valorTotal = 0;

    // Verificar se é um objeto ou JSON
    let valoresSafras =
      divida.valores_por_safra || divida.valores_por_ano || {};
    if (typeof valoresSafras === "string") {
      try {
        valoresSafras = JSON.parse(valoresSafras);
      } catch (e) {
        valoresSafras = {};
      }
    }

    // Somar o valor total de todas as safras para esta dívida
    if (valoresSafras && typeof valoresSafras === "object") {
      for (const safraId in valoresSafras) {
        const valor = parseFloat(valoresSafras[safraId]) || 0;
        valorTotal += valor;
      }
    }

    // Categorizar o valor total
    if (valorTotal > 0) {
      if (divida.tipo === "BANCO" || divida.tipo === "TRADING") {
        totalBancosTodos += valorTotal;
      } else if (divida.tipo === "OUTROS") {
        totalOutrosTodos += valorTotal;
      }
    }
  }

  // Calcular o total global de passivos
  const totalPassivosTodos = totalBancosTodos + totalOutrosTodos;

  // Vamos agora calcular o total de caixas e disponibilidades por safra
  // Isso é necessário para calcular a dívida líquida específica de cada safra
  const caixasPorSafra: Record<string, number> = {};

  // Inicializar o objeto para cada safra
  for (const safraId of safrasParaAnalisar) {
    caixasPorSafra[safraId] = 0;
  }

  // Calcular os totais de caixa para cada safra específica
  for (const caixa of caixaDisponibilidades) {
    // Verificar se é um objeto ou JSON
    let valoresSafras = caixa.valores_por_safra || caixa.valores_por_ano || {};
    if (typeof valoresSafras === "string") {
      try {
        valoresSafras = JSON.parse(valoresSafras);
      } catch (e) {
        valoresSafras = {};
      }
    }

    // Adicionar valor de caixa para cada safra específica
    if (valoresSafras && typeof valoresSafras === "object") {
      for (const safraId in valoresSafras) {
        if (safrasParaAnalisar.includes(safraId)) {
          const valor = parseFloat(valoresSafras[safraId]) || 0;
          if (valor > 0) {
            caixasPorSafra[safraId] += valor;
          }
        }
      }
    }
  }

  // Agora vamos criar uma entrada para cada safra
  for (const safraId of safrasParaAnalisar) {
    const safra = safras.find((s) => s.id === safraId);
    if (!safra) continue;

    // Obter o total de caixas desta safra específica
    const totalCaixaSafra = caixasPorSafra[safraId] || 0;

    // Calcular a dívida líquida específica desta safra:
    // Dívida Líquida = Dívida Total - Caixas e Disponibilidades desta safra
    const liquidoSafra = Math.max(0, totalPassivosTodos - totalCaixaSafra);

    // Adicionar ao resultado: bancos/outros/total são globais, líquida é específica da safra
    resultado.push({
      safra: safra.nome,
      bancos_tradings: totalBancosTodos,
      outros: totalOutrosTodos,
      total: totalPassivosTodos,
      liquido: liquidoSafra,
    });
  }

  // Como já buscamos em ordem crescente, as safras mais antigas já estarão à esquerda
  return { data: resultado, safraName: safraAtualNome };
}

export function FinancialTotalLiabilitiesChart({
  organizationId,
  selectedYear,
}: FinancialTotalLiabilitiesChartProps) {
  const [data, setData] = useState<LiabilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displaySafra, setDisplaySafra] = useState<string | undefined>(
    undefined
  );

  // Efeito para carregar dados quando o valor solicitado ou organização mudar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getTotalLiabilitiesData(
          organizationId,
          selectedYear
        );

        const { data: liabilitiesData, safraName } = result;

        setData(liabilitiesData);
        setDisplaySafra(safraName);
      } catch (err) {
        console.error("Erro ao carregar dados de passivos totais:", err);
        setError("Erro ao carregar gráfico de passivos totais");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId, selectedYear]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <LayoutList className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Passivos Totais</CardTitle>
                <CardDescription className="text-white/80">
                  Carregando dados...
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground dark:text-gray-400">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Carregando dados financeiros...
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
                <LayoutList className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Passivos Totais</CardTitle>
                <CardDescription className="text-white/80">
                  {error}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground dark:text-gray-400">
              {error}
            </div>
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
                <LayoutList className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Passivos Totais {displaySafra ? `(${displaySafra})` : ""}
                </CardTitle>
                <CardDescription className="text-white/80">
                  Composição dos passivos por tipo
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex flex-col items-center justify-center">
            <div className="text-muted-foreground dark:text-gray-400 mb-4">
              Nenhum dado de passivos encontrado
            </div>
            <div className="text-center text-sm text-muted-foreground dark:text-gray-400 max-w-md">
              Para visualizar este gráfico, cadastre dívidas bancárias, de
              fornecedores e outras dívidas no módulo financeiro.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular estatísticas para o footer
  const ultimaSafra = data[data.length - 1];
  const totalPassivos = ultimaSafra.total;
  const percentualBancosTradings =
    (ultimaSafra.bancos_tradings / totalPassivos) * 100;
  const percentualOutros = (ultimaSafra.outros / totalPassivos) * 100;
  const percentualLiquido = (ultimaSafra.liquido / totalPassivos) * 100;

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <LayoutList className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Posição da Dívida por Safra
              </CardTitle>
              <CardDescription className="text-white/80">
                {data && data.length > 0
                  ? `Valores totais das dívidas em todas as safras (${
                      data[0]?.safra
                    } - ${data[data.length - 1]?.safra})`
                  : "Valores totais das dívidas em todas as safras"}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-6">
        <div className="w-full h-[350px] sm:h-[400px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                barGap={0}
                barCategoryGap="5%"
                barSize={30}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="safra"
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickMargin={25}
                  tick={{ fontSize: 11, fill: "var(--foreground)" }}
                  interval={0}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value, 0)}
                  tickLine={false}
                  axisLine={false}
                  width={90} // Aumentado para acomodar o espaço extra
                  tick={{ fill: "var(--foreground)" }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent className="dark:border-gray-700" />
                  }
                  formatter={(value: any, name: any) => {
                    // Formatar o valor com espaço entre o número e a unidade
                    const formattedValue = formatCurrency(
                      Number(value)
                    ).replace(/mi$/, " mi");
                    return [
                      formattedValue,
                      chartConfig[name as keyof typeof chartConfig]?.label ||
                        name,
                    ];
                  }}
                  labelFormatter={(label) => `Safra: ${label}`}
                />
                <Legend
                  verticalAlign="top"
                  wrapperStyle={{ paddingTop: "10px" }}
                  formatter={(value, entry) => (
                    <span className="text-foreground dark:text-white">
                      {value}
                    </span>
                  )}
                />
                {/* Ordem das barras ajustada para a visualização correta: total, líquida, bancos, outros */}
                <Bar
                  dataKey="outros"
                  name="Outros Passivos"
                  fill={chartConfig.outros.color}
                />
                <Bar
                  dataKey="bancos_tradings"
                  name="Dívida Bancária"
                  fill={chartConfig.bancos_tradings.color}
                />
                <Bar
                  dataKey="liquido"
                  name="Dívida Líquida"
                  fill={chartConfig.liquido.color}
                />
                <Bar
                  dataKey="total"
                  name="Dívida Total"
                  fill={chartConfig.total.color}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
