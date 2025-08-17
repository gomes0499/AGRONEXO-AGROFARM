"use server";

import { createClient } from "@/lib/supabase/server";

export interface DebtDetail {
  id: string;
  nome: string;
  banco?: string;
  fornecedor?: string;
  area_hectares?: number;
  tipo?: string;
  moeda?: string;
  taxa_juros?: number;
  valores_por_ano: Record<string, number>;
}

export interface DebtDetailsResponse {
  bancos: DebtDetail[];
  terras: DebtDetail[];
  fornecedores: DebtDetail[];
  arrendamentos: DebtDetail[];
}

export async function getDebtDetails(organizationId: string): Promise<DebtDetailsResponse> {
  const supabase = await createClient();
  
  // Buscar safras da organização com taxa de câmbio
  const { data: safras } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim, taxa_cambio_usd")
    .eq("organizacao_id", organizationId)
    .order("ano_inicio");

  if (!safras || safras.length === 0) {
    return { bancos: [], terras: [], fornecedores: [], arrendamentos: [] };
  }

  // Criar mapeamento safraId -> nome
  const safraToYear: Record<string, string> = {};
  safras.forEach(safra => {
    safraToYear[safra.id] = safra.nome;
  });

  // Buscar taxa de câmbio por safra
  const dolarPorAno: Record<string, number> = {};
  
  // Buscar taxa de câmbio de cada safra
  for (const safra of safras) {
    const taxaCambio = safra.taxa_cambio_usd ? parseFloat(safra.taxa_cambio_usd) : 5.5;
    dolarPorAno[safra.nome] = taxaCambio;
  }

  // Buscar dívidas bancárias
  const { data: dividasBancarias, error: errorBancos } = await supabase
    .from("dividas_bancarias")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("instituicao_bancaria");

  // Buscar dívidas de terras
  const { data: dividasTerras, error: errorTerras } = await supabase
    .from("aquisicao_terras")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("nome_fazenda");

  // Buscar dívidas de fornecedores
  const { data: dividasFornecedores, error: errorFornecedores } = await supabase
    .from("dividas_fornecedores")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("nome");

  // Buscar arrendamentos
  const { data: arrendamentos, error: errorArrendamentos } = await supabase
    .from("arrendamentos")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("nome_fazenda");

  // Processar e agrupar dívidas bancárias por instituição e modalidade
  const bancosAgrupados: Record<string, {
    nome: string;
    banco: string;
    tipo: string;
    moeda: string;
    taxa_juros: number;
    valores_por_ano: Record<string, number>;
    ids: string[];
  }> = {};
  
  (dividasBancarias || []).forEach(divida => {
    const chave = `${divida.instituicao_bancaria || 'Banco'} - ${divida.modalidade || divida.tipo || 'Empréstimo'}`;
    
    if (!bancosAgrupados[chave]) {
      bancosAgrupados[chave] = {
        nome: chave,
        banco: divida.instituicao_bancaria,
        tipo: divida.modalidade || divida.tipo,
        moeda: divida.moeda || 'BRL',
        taxa_juros: Number(divida.taxa_real) || 0,
        valores_por_ano: {},
        ids: []
      };
    }
    
    // Adicionar ID à lista
    bancosAgrupados[chave].ids.push(divida.id);
    
    // Somar valores por ano
    const valoresField = divida.fluxo_pagamento_anual;
    if (valoresField) {
      const fluxo = typeof valoresField === 'string' 
        ? JSON.parse(valoresField) 
        : valoresField;
      
      for (const safraId in fluxo) {
        if (safraToYear[safraId]) {
          const safraAno = safraToYear[safraId];
          if (!bancosAgrupados[chave].valores_por_ano[safraAno]) {
            bancosAgrupados[chave].valores_por_ano[safraAno] = 0;
          }
          
          let valorAno = Number(fluxo[safraId]) || 0;
          
          // Se a moeda for USD, converter para BRL
          if (divida.moeda === 'USD') {
            const taxaCambio = dolarPorAno[safraAno] || 5.5;
            valorAno = valorAno * taxaCambio;
          }
          
          bancosAgrupados[chave].valores_por_ano[safraAno] += valorAno;
        }
      }
    }
    
    // Manter a maior taxa de juros (caso haja diferenças)
    if (Number(divida.taxa_real) > bancosAgrupados[chave].taxa_juros) {
      bancosAgrupados[chave].taxa_juros = Number(divida.taxa_real);
    }
  });
  
  // Converter para array
  const bancosDetalhados: DebtDetail[] = Object.values(bancosAgrupados).map(banco => ({
    id: banco.ids[0], // Usar o primeiro ID como referência
    nome: banco.nome,
    banco: banco.banco,
    tipo: banco.tipo,
    moeda: banco.moeda,
    taxa_juros: banco.taxa_juros,
    valores_por_ano: banco.valores_por_ano
  }));

  // Processar e agrupar dívidas de terras por nome
  const terrasAgrupadas: Record<string, {
    nome: string;
    area_hectares: number;
    tipo: string;
    moeda: string;
    valores_por_ano: Record<string, number>;
    ids: string[];
  }> = {};
  
  (dividasTerras || []).forEach(terra => {
    const nome = terra.nome_fazenda || 'Aquisição de Terra';
    
    if (!terrasAgrupadas[nome]) {
      terrasAgrupadas[nome] = {
        nome,
        area_hectares: Number(terra.hectares) || 0,
        tipo: terra.tipo,
        moeda: terra.moeda || 'BRL',
        valores_por_ano: {},
        ids: []
      };
    }
    
    // Adicionar ID à lista
    terrasAgrupadas[nome].ids.push(terra.id);
    
    // Somar valores por ano
    if (terra.safra_id && safraToYear[terra.safra_id]) {
      const safraAno = safraToYear[terra.safra_id];
      if (!terrasAgrupadas[nome].valores_por_ano[safraAno]) {
        terrasAgrupadas[nome].valores_por_ano[safraAno] = 0;
      }
      
      let valorAno = terra.valor_total || 0;
      
      // Se a moeda for USD, converter para BRL
      if (terra.moeda === 'USD') {
        const taxaCambio = dolarPorAno[safraAno] || 5.5;
        valorAno = valorAno * taxaCambio;
      }
      
      terrasAgrupadas[nome].valores_por_ano[safraAno] += valorAno;
    }
    
    // Manter a maior área (caso haja diferenças)
    if (Number(terra.hectares) > terrasAgrupadas[nome].area_hectares) {
      terrasAgrupadas[nome].area_hectares = Number(terra.hectares);
    }
  });
  
  // Converter para array
  const terrasDetalhadas: DebtDetail[] = Object.values(terrasAgrupadas).map(terra => ({
    id: terra.ids[0], // Usar o primeiro ID como referência
    nome: terra.nome,
    area_hectares: terra.area_hectares,
    tipo: terra.tipo,
    moeda: terra.moeda,
    valores_por_ano: terra.valores_por_ano
  }));

  // Processar e agrupar dívidas de fornecedores por nome
  const fornecedoresAgrupados: Record<string, {
    nome: string;
    categoria: string;
    moeda: string;
    valores_por_ano: Record<string, number>;
    ids: string[];
  }> = {};
  
  (dividasFornecedores || []).forEach(fornecedor => {
    const nome = fornecedor.nome || 'Fornecedor';
    
    if (!fornecedoresAgrupados[nome]) {
      fornecedoresAgrupados[nome] = {
        nome,
        categoria: fornecedor.categoria,
        moeda: fornecedor.moeda || 'BRL',
        valores_por_ano: {},
        ids: []
      };
    }
    
    // Adicionar ID à lista
    fornecedoresAgrupados[nome].ids.push(fornecedor.id);
    
    // Somar valores por ano
    if (fornecedor.valores_por_ano) {
      const valores = typeof fornecedor.valores_por_ano === 'string'
        ? JSON.parse(fornecedor.valores_por_ano)
        : fornecedor.valores_por_ano;
      
      for (const safraId in valores) {
        if (safraToYear[safraId]) {
          const safraAno = safraToYear[safraId];
          if (!fornecedoresAgrupados[nome].valores_por_ano[safraAno]) {
            fornecedoresAgrupados[nome].valores_por_ano[safraAno] = 0;
          }
          
          let valorAno = Number(valores[safraId]) || 0;
          
          // Se a moeda for USD, converter para BRL
          if (fornecedor.moeda === 'USD') {
            const taxaCambio = dolarPorAno[safraAno] || 5.5;
            valorAno = valorAno * taxaCambio;
          }
          
          fornecedoresAgrupados[nome].valores_por_ano[safraAno] += valorAno;
        }
      }
    }
  });
  
  // Converter para array
  const fornecedoresDetalhados: DebtDetail[] = Object.values(fornecedoresAgrupados).map(fornecedor => ({
    id: fornecedor.ids[0], // Usar o primeiro ID como referência
    nome: fornecedor.nome,
    fornecedor: fornecedor.nome,
    tipo: fornecedor.categoria,
    moeda: fornecedor.moeda,
    valores_por_ano: fornecedor.valores_por_ano
  }));

  // Processar e agrupar arrendamentos por fazenda
  const arrendamentosAgrupados: Record<string, {
    nome: string;
    area_hectares: number;
    tipo: string;
    valores_por_ano: Record<string, number>;
    ids: string[];
  }> = {};
  
  (arrendamentos || []).forEach(arrendamento => {
    const nome = arrendamento.nome_fazenda || 'Arrendamento';
    
    if (!arrendamentosAgrupados[nome]) {
      arrendamentosAgrupados[nome] = {
        nome,
        area_hectares: Number(arrendamento.area_arrendada) || 0,
        tipo: arrendamento.tipo_pagamento || 'Arrendamento',
        valores_por_ano: {},
        ids: []
      };
    }
    
    // Adicionar ID à lista
    arrendamentosAgrupados[nome].ids.push(arrendamento.id);
    
    // Processar valores por ano
    if (arrendamento.custos_por_ano) {
      const custos = typeof arrendamento.custos_por_ano === 'string'
        ? JSON.parse(arrendamento.custos_por_ano)
        : arrendamento.custos_por_ano;
      
      for (const safraId in custos) {
        if (safraToYear[safraId]) {
          const safraAno = safraToYear[safraId];
          if (!arrendamentosAgrupados[nome].valores_por_ano[safraAno]) {
            arrendamentosAgrupados[nome].valores_por_ano[safraAno] = 0;
          }
          
          const valorAno = Number(custos[safraId]) || 0;
          arrendamentosAgrupados[nome].valores_por_ano[safraAno] += valorAno;
        }
      }
    }
    
    // Somar área se houver múltiplos arrendamentos para a mesma fazenda
    if (Number(arrendamento.area_arrendada) > 0) {
      arrendamentosAgrupados[nome].area_hectares += Number(arrendamento.area_arrendada);
    }
  });
  
  // Converter para array
  const arrendamentosDetalhados: DebtDetail[] = Object.values(arrendamentosAgrupados).map(arrendamento => ({
    id: arrendamento.ids[0], // Usar o primeiro ID como referência
    nome: arrendamento.nome,
    area_hectares: arrendamento.area_hectares,
    tipo: arrendamento.tipo,
    valores_por_ano: arrendamento.valores_por_ano
  }));

  return {
    bancos: bancosDetalhados,
    terras: terrasDetalhadas,
    fornecedores: fornecedoresDetalhados,
    arrendamentos: arrendamentosDetalhados
  };
}