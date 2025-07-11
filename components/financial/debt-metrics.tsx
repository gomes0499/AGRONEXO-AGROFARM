"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Percent,
  Building2,
  Globe,
  Wallet,
  Info,
  Loader2,
  BarChart3
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils/formatters";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { convertCurrency } from "@/lib/utils/currency-converter";
import { getCurrentExchangeRate } from "@/lib/actions/financial-exchange-rate-actions";

interface DividaBancaria {
  id: string;
  modalidade: string;
  instituicao_bancaria: string;
  ano_contratacao: number;
  indexador: string;
  taxa_real: number;
  fluxo_pagamento_anual: any;
  moeda: string;
  saldo_devedor?: number;
}

interface DividaTerra {
  id: string;
  propriedade_id: string;
  credor: string;
  data_aquisicao: string;
  data_vencimento: string;
  moeda: string;
  valor_total: number;
  fluxo_pagamento_anual: any;
}

interface DividaFornecedor {
  id: string;
  nome: string;
  moeda: string;
  valores_por_ano: any;
}

interface DebtMetricsProps {
  dividasBancarias: DividaBancaria[];
  dividasTerras: DividaTerra[];
  dividasFornecedores: DividaFornecedor[];
  safras?: any[];
  organizationId: string;
}

interface KpiItemProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  tooltip?: string;
}

function KpiItem({
  title,
  value,
  change,
  isPositive,
  icon,
  loading,
  tooltip,
}: KpiItemProps) {
  return (
    <div className="flex items-start p-5 transition-colors">
      <div className="rounded-full p-2 mr-3 bg-primary">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-background dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {loading ? (
          <div className="flex items-center mt-1">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold mt-1 dark:text-gray-100">
              {value}
            </h3>
            <p className="text-xs font-medium mt-1 text-muted-foreground">
              {change}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function DebtMetrics({ 
  dividasBancarias = [], 
  dividasTerras = [], 
  dividasFornecedores = [],
  safras = [],
  organizationId
}: DebtMetricsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(5.7); // Taxa padrão
  const [metrics, setMetrics] = useState({
    totalDividas: 0,
    totalBancarias: 0,
    totalTerras: 0,
    totalFornecedores: 0,
    percentualUSD: 0,
    percentualBRL: 0,
    taxaMediaJuros: 0,
    prazoMedio: 0,
  });

  useEffect(() => {
    const loadExchangeRate = async () => {
      try {
        const { exchangeRate: rate } = await getCurrentExchangeRate(organizationId);
        setExchangeRate(rate);
      } catch (error) {
        console.error('Erro ao carregar taxa de câmbio:', error);
        setExchangeRate(5.7); // Fallback
      }
    };

    loadExchangeRate();
  }, [organizationId]);

  useEffect(() => {
    try {
      // Verificar se os arrays existem
      if (!dividasBancarias || !dividasTerras || !dividasFornecedores) {
        return;
      }

      // Calcular total de dívidas bancárias (em BRL)
      const totalBancarias = dividasBancarias.reduce((sum, divida: any) => {
        try {
          let valor = 0;
          
          // Usar o campo total se existir
          if (divida.total) {
            valor = divida.total;
          } 
          // Se tem saldo devedor, usa ele, senão calcula do fluxo
          else if (divida.saldo_devedor) {
            valor = divida.saldo_devedor;
          }
          else {
            let fluxo = {};
            if (divida.fluxo_pagamento_anual) {
              fluxo = typeof divida.fluxo_pagamento_anual === 'string' 
                ? JSON.parse(divida.fluxo_pagamento_anual) 
                : divida.fluxo_pagamento_anual || {};
            }
            
            valor = Object.values(fluxo).reduce<number>((s, v) => s + (Number(v) || 0), 0);
          }
          
          // Converter USD para BRL se necessário
          if (divida.moeda === 'USD') {
            valor = convertCurrency(valor, 'USD', 'BRL', exchangeRate);
          }
          
          return sum + valor;
        } catch (error) {
          console.error('Erro ao processar dívida bancária:', error);
          return sum;
        }
      }, 0);

    // Calcular total de dívidas de terras (em BRL)
    const totalTerras = dividasTerras.reduce((sum, divida) => {
      let valor = divida.valor_total || 0;
      
      // Converter USD para BRL se necessário
      if (divida.moeda === 'USD') {
        valor = convertCurrency(valor, 'USD', 'BRL', exchangeRate);
      }
      
      return sum + valor;
    }, 0);

    // Calcular total de dívidas de fornecedores (em BRL)
    const totalFornecedores = dividasFornecedores.reduce((sum, fornecedor: any) => {
      try {
        let valor = 0;
        
        // Usar o campo total se existir
        if (fornecedor.total) {
          valor = fornecedor.total;
        } else {
          let valores = {};
          if (fornecedor.valores_por_ano) {
            valores = typeof fornecedor.valores_por_ano === 'string'
              ? JSON.parse(fornecedor.valores_por_ano)
              : fornecedor.valores_por_ano || {};
          }
          
          valor = Object.values(valores).reduce<number>((s, v) => s + (Number(v) || 0), 0);
        }
        
        // Converter USD para BRL se necessário
        if (fornecedor.moeda === 'USD') {
          valor = convertCurrency(valor, 'USD', 'BRL', exchangeRate);
        }
        
        return sum + valor;
      } catch (error) {
        console.error('Erro ao processar fornecedor:', error);
        return sum;
      }
    }, 0);

    // Calcular total geral
    const totalDividas = totalBancarias + totalTerras + totalFornecedores;

    // Calcular percentual por moeda baseado no valor total em BRL
    let totalUSDOriginal = 0;
    let totalBRLOriginal = 0;

    // Dívidas bancárias
    dividasBancarias.forEach((divida: any) => {
      try {
        let valor = 0;
        
        // Usar o campo total se existir
        if (divida.total) {
          valor = divida.total;
        } else if (divida.saldo_devedor) {
          valor = divida.saldo_devedor;
        } else if (divida.fluxo_pagamento_anual) {
          let fluxo = {};
          fluxo = typeof divida.fluxo_pagamento_anual === 'string' 
            ? JSON.parse(divida.fluxo_pagamento_anual) 
            : divida.fluxo_pagamento_anual || {};
          
          valor = Object.values(fluxo).reduce<number>((s, v) => s + (Number(v) || 0), 0);
        }
        
        if (divida.moeda === 'USD') {
          totalUSDOriginal += valor;
        } else {
          totalBRLOriginal += valor;
        }
      } catch (error) {
        console.error('Erro ao processar moeda da dívida bancária:', error);
      }
    });

    // Dívidas de terras
    dividasTerras.forEach(divida => {
      if (divida.moeda === 'USD') {
        totalUSDOriginal += divida.valor_total;
      } else {
        totalBRLOriginal += divida.valor_total;
      }
    });

    // Dívidas de fornecedores
    dividasFornecedores.forEach((fornecedor: any) => {
      try {
        let total = 0;
        
        // Usar o campo total se existir
        if (fornecedor.total) {
          total = fornecedor.total;
        } else if (fornecedor.valores_por_ano) {
          let valores = {};
          valores = typeof fornecedor.valores_por_ano === 'string'
            ? JSON.parse(fornecedor.valores_por_ano)
            : fornecedor.valores_por_ano || {};
          
          total = Object.values(valores).reduce<number>((s, v) => s + (Number(v) || 0), 0);
        }
        
        if (fornecedor.moeda === 'USD') {
          totalUSDOriginal += total;
        } else {
          totalBRLOriginal += total;
        }
      } catch (error) {
        console.error('Erro ao processar moeda do fornecedor:', error);
      }
    });

    // Converter USD para BRL para calcular o percentual
    const totalUSDInBRL = convertCurrency(totalUSDOriginal, 'USD', 'BRL', exchangeRate);
    const totalBRLInBRL = totalBRLOriginal;
    const totalGeralInBRL = totalUSDInBRL + totalBRLInBRL;

    const percentualUSD = totalGeralInBRL > 0 ? (totalUSDInBRL / totalGeralInBRL) * 100 : 0;
    const percentualBRL = totalGeralInBRL > 0 ? (totalBRLInBRL / totalGeralInBRL) * 100 : 0;

    // Calcular taxa média de juros (apenas dívidas bancárias)
    const taxaMediaJuros = dividasBancarias.length > 0
      ? dividasBancarias.reduce((sum, d) => sum + (d.taxa_real || 0), 0) / dividasBancarias.length
      : 0;

    // Calcular prazo médio (anos restantes)
    const currentYear = new Date().getFullYear();
    let totalPrazos = 0;
    let countPrazos = 0;

    // Considerar dívidas bancárias - assumir prazo baseado no fluxo de pagamentos
    dividasBancarias.forEach((divida: any) => {
      if (divida.fluxo_pagamento_anual) {
        const fluxo = typeof divida.fluxo_pagamento_anual === 'string' 
          ? JSON.parse(divida.fluxo_pagamento_anual) 
          : divida.fluxo_pagamento_anual || {};
        
        // Encontrar o último ano com pagamento
        const anos = Object.keys(fluxo).map(safraId => {
          // Extrair o ano da safra (assumindo que está no formato YYYY/YY)
          const safra = safras?.find((s: any) => s.id === safraId);
          return safra ? safra.ano_fim : 0;
        }).filter(ano => ano > currentYear);
        
        if (anos.length > 0) {
          const ultimoAno = Math.max(...anos);
          const anosRestantes = ultimoAno - currentYear;
          if (anosRestantes > 0) {
            totalPrazos += anosRestantes;
            countPrazos++;
          }
        }
      }
    });

    // Considerar dívidas de terras
    dividasTerras.forEach((divida: any) => {
      // Se tem ano definido, usar ele
      if (divida.ano && divida.ano > currentYear) {
        const anosRestantes = divida.ano - currentYear;
        totalPrazos += anosRestantes;
        countPrazos++;
      } else if (divida.data_vencimento) {
        const vencimento = new Date(divida.data_vencimento).getFullYear();
        const anosRestantes = vencimento - currentYear;
        if (anosRestantes > 0) {
          totalPrazos += anosRestantes;
          countPrazos++;
        }
      }
    });

    const prazoMedio = countPrazos > 0 ? totalPrazos / countPrazos : 0;

    setMetrics({
      totalDividas,
      totalBancarias,
      totalTerras,
      totalFornecedores,
      percentualUSD,
      percentualBRL,
      taxaMediaJuros,
      prazoMedio,
    });
    } catch (error) {
      console.error('Erro ao calcular métricas de dívida:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dividasBancarias, dividasTerras, dividasFornecedores, exchangeRate]);

  if (isLoading) {
    return (
      <TooltipProvider>
        <Card className="mb-6">
          <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Métricas de Dívida Consolidada
                </CardTitle>
                <CardDescription className="text-white/80">
                  Carregando métricas...
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Card className="mb-6">
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Métricas de Dívida Consolidada
              </CardTitle>
              <CardDescription className="text-white/80">
                Visão geral das dívidas e obrigações financeiras
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Total de Dívidas */}
          <div className="relative">
            <KpiItem
              title="Total de Dívidas"
              value={formatCurrency(metrics.totalDividas, 0)}
              change="Soma de todas as dívidas"
              isPositive={true}
              icon={<DollarSign className="h-5 w-5 text-white" />}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dívidas Bancárias */}
          <div className="relative">
            <KpiItem
              title="Dívidas Bancárias"
              value={formatCurrency(metrics.totalBancarias, 0)}
              change={`${metrics.totalDividas > 0 ? formatPercent((metrics.totalBancarias / metrics.totalDividas) * 100) : '0%'} do total`}
              isPositive={true}
              icon={<Building2 className="h-5 w-5 text-white" />}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Exposição em USD */}
          <div className="relative">
            <KpiItem
              title="Exposição em USD"
              value={formatPercent(metrics.percentualUSD)}
              change={`BRL: ${formatPercent(metrics.percentualBRL)}`}
              isPositive={true}
              icon={<Globe className="h-5 w-5 text-white" />}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Taxa Média de Juros */}
          <div>
            <KpiItem
              title="Taxa Média de Juros"
              value={`${metrics.taxaMediaJuros.toFixed(2)}%`}
              change="Média das taxas bancárias"
              isPositive={true}
              icon={<Percent className="h-5 w-5 text-white" />}
            />
          </div>

          {/* Dívidas de Terras */}
          <div className="relative">
            <KpiItem
              title="Dívidas de Terras"
              value={formatCurrency(metrics.totalTerras, 0)}
              change={`${metrics.totalDividas > 0 ? formatPercent((metrics.totalTerras / metrics.totalDividas) * 100) : '0%'} do total`}
              isPositive={true}
              icon={<TrendingUp className="h-5 w-5 text-white" />}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dívidas Fornecedores */}
          <div className="relative">
            <KpiItem
              title="Dívidas Fornecedores"
              value={formatCurrency(metrics.totalFornecedores, 0)}
              change={`${dividasFornecedores.length} fornecedor${dividasFornecedores.length !== 1 ? 'es' : ''}`}
              isPositive={true}
              icon={<Wallet className="h-5 w-5 text-white" />}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Prazo Médio */}
          <div className="relative">
            <KpiItem
              title="Prazo Médio"
              value={`${metrics.prazoMedio.toFixed(1)} anos`}
              change="Vencimento médio das dívidas"
              isPositive={true}
              icon={<Calendar className="h-5 w-5 text-white" />}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Total de Contratos */}
          <div>
            <KpiItem
              title="Total de Contratos"
              value={(dividasBancarias.length + dividasTerras.length + dividasFornecedores.length).toString()}
              change="Contratos ativos"
              isPositive={true}
              icon={<Info className="h-5 w-5 text-white" />}
            />
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}