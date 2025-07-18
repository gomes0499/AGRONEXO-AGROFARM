import * as XLSX from 'xlsx';
import { createClient } from "@/lib/supabase/server";

export interface OrganizationData {
  id: string;
  nome: string;
  tipo: string;
  documento: string;
  inscricao_estadual?: string;
  email: string;
  telefone: string;
  endereco_completo: string;
  website?: string;
  estrutura_societaria: any[];
  created_at: string;
}

export async function generateCompleteExcelExport(organizationId: string, supabaseClient?: any): Promise<Blob> {
  try {
    const supabase = supabaseClient || await createClient();
    
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Aba 1: Dados da Organização
    await addOrganizationDataSheet(wb, supabase, organizationId);
    
    // Aba 2: Preços (Commodities e Câmbio)
    await addPricesSheet(wb, supabase, organizationId);
    
    // Aba 3: Áreas de Plantio
    await addPlantingAreasSheet(wb, supabase, organizationId);
    
    // Aba 4: Produtividade
    await addProductivitySheet(wb, supabase, organizationId);
    
    // Aba 5: Custos de Produção
    await addProductionCostsSheet(wb, supabase, organizationId);
    
    // Aba 6: Bens Imóveis
    await addRealEstateSheet(wb, supabase, organizationId);
    
    // Aba 7: Arrendamentos
    await addLeaseSheet(wb, supabase, organizationId);
    
    // Aba 8: Equipamentos
    await addEquipmentSheet(wb, supabase, organizationId);
    
    // Aba 9: Investimentos
    await addInvestmentsSheet(wb, supabase, organizationId);
    
    // Aba 10: Vendas de Ativos
    await addAssetSalesSheet(wb, supabase, organizationId);
    
    // Aba 11: Dívidas Bancárias
    await addBankDebtsSheet(wb, supabase, organizationId);
    
    // Aba 12: Dívidas de Terras
    await addLandDebtsSheet(wb, supabase, organizationId);
    
    // Aba 13: Dívidas de Fornecedores
    await addSupplierDebtsSheet(wb, supabase, organizationId);
    
    // Aba 14: Caixa e Disponibilidades
    await addCashAvailabilitySheet(wb, supabase, organizationId);
    
    // Aba 15: Operações Financeiras
    await addFinancialOperationsSheet(wb, supabase, organizationId);
    
    // Aba 16: Outras Despesas
    await addOtherExpensesSheet(wb, supabase, organizationId);
    
    // Aba 17: Outras Receitas
    await addOtherRevenuesSheet(wb, supabase, organizationId);
    
    
    // Gerar o arquivo Excel
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
  } catch (error) {
    console.error('Erro ao gerar exportação Excel:', error);
    throw error;
  }
}

async function addOrganizationDataSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar dados da organização
    const { data: orgData, error } = await supabase
      .from('organizacoes')
      .select('*')
      .eq('id', organizationId)
      .single();
      
    if (error) throw error;
    
    // Preparar dados para a planilha
    const organizationInfo = [
      ['DADOS DA ORGANIZAÇÃO'],
      [],
      ['INFORMAÇÕES GERAIS'],
      [],
      ['Nome da Organização', orgData?.nome || 'N/A'],
      ['Tipo', orgData?.tipo || 'N/A'],
      ['Documento (CPF/CNPJ)', orgData?.documento || 'N/A'],
      ['Inscrição Estadual', orgData?.inscricao_estadual || 'N/A'],
      ['Email', orgData?.email || 'N/A'],
      ['Telefone', orgData?.telefone || 'N/A'],
      ['Endereço Completo', orgData?.endereco_completo || 'N/A'],
      ['Website', orgData?.website || 'N/A'],
      ['Data de Criação', orgData?.created_at ? new Date(orgData.created_at).toLocaleDateString('pt-BR') : 'N/A'],
      [],
      ['ESTRUTURA SOCIETÁRIA'],
      []
    ];
    
    // Adicionar estrutura societária se existir
    if (orgData?.estrutura_societaria && Array.isArray(orgData.estrutura_societaria)) {
      organizationInfo.push(['Nome', 'Participação', 'Tipo']);
      orgData.estrutura_societaria.forEach((socio: any) => {
        // Determinar tipo baseado no tipo_documento
        let tipo = 'N/A';
        if (socio.tipo_documento === 'cpf') {
          tipo = 'Pessoa Física';
        } else if (socio.tipo_documento === 'cnpj') {
          tipo = 'Pessoa Jurídica';
        }
        
        // Formatar participação
        const participacao = socio.percentual ? `${socio.percentual}%` : 'N/A';
        
        organizationInfo.push([
          socio.nome || 'N/A',
          participacao,
          tipo
        ]);
      });
    } else {
      organizationInfo.push(['Nenhuma estrutura societária cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(organizationInfo);
    
    // Configurar larguras das colunas
    ws['!cols'] = [
      { wch: 30 }, // Campo
      { wch: 50 }, // Valor
      { wch: 20 }  // Tipo
    ];
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '1-Dados da Organização');
    
  } catch (error) {
    console.error('Erro ao adicionar dados da organização:', error);
    throw error;
  }
}

async function addPricesSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar safras ordenadas
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome', { ascending: true });

    if (safrasError) throw safrasError;

    // Buscar preços de commodities (nova estrutura)
    const { data: commodityPrices, error: commodityError } = await supabase
      .from('commodity_price_projections')
      .select(`
        *,
        culturas!inner(nome),
        sistemas!inner(nome),
        ciclos!inner(nome)
      `)
      .eq('organizacao_id', organizationId);

    if (commodityError) throw commodityError;

    // Buscar cotações de câmbio (nova estrutura)
    const { data: exchangeRates, error: exchangeError } = await supabase
      .from('cotacoes_cambio')
      .select('*')
      .eq('organizacao_id', organizationId);

    if (exchangeError) throw exchangeError;

    // Preparar dados para a planilha
    const pricesData = [
      ['PREÇOS E COTAÇÕES'],
      [],
      ['PREÇOS POR TIPO E SAFRA'],
      [],
      ['Tipo', 'Item', 'Unidade', ...safras?.map((s: any) => s.nome) || []]
    ];

    if (safras && safras.length > 0) {
      // Processar preços de commodities
      if (commodityPrices && commodityPrices.length > 0) {
        commodityPrices.forEach((commodity: any) => {
          const nomeCompleto = `${commodity.culturas?.nome || commodity.commodity} - ${commodity.sistemas?.nome || ''} - ${commodity.ciclos?.nome || ''}`.replace(/ - $/, '');
          
          const linha = [
            'Commodity',
            nomeCompleto,
            commodity.unidade || 'R$/saca'
          ];

          // Para cada safra, buscar o preço no JSONB
          safras.forEach((safra: any) => {
            let valor = '-';
            
            if (commodity.precos_por_ano && commodity.precos_por_ano[safra.id]) {
              valor = formatCurrency(commodity.precos_por_ano[safra.id]);
            }
            
            linha.push(valor);
          });

          pricesData.push(linha);
        });
      }

      // Processar cotações de câmbio
      if (exchangeRates && exchangeRates.length > 0) {
        exchangeRates.forEach((exchange: any) => {
          const linha = [
            'Câmbio',
            exchange.tipo_moeda || 'Dólar',
            exchange.unidade || 'R$'
          ];

          // Para cada safra, buscar a cotação no JSONB
          safras.forEach((safra: any) => {
            let valor = '-';
            
            if (exchange.cotacoes_por_ano && exchange.cotacoes_por_ano[safra.id]) {
              valor = formatCurrency(exchange.cotacoes_por_ano[safra.id]);
            }
            
            linha.push(valor);
          });

          pricesData.push(linha);
        });
      }

      // Se não houver dados nas novas tabelas
      if ((!commodityPrices || commodityPrices.length === 0) && (!exchangeRates || exchangeRates.length === 0)) {
        pricesData.push(['Nenhum preço cadastrado']);
      }
    } else {
      pricesData.push(['Nenhuma safra cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(pricesData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 15 }, // Tipo
      { wch: 30 }, // Item
      { wch: 12 }  // Unidade
    ];
    
    // Adicionar colunas para cada safra
    safras?.forEach(() => {
      colWidths.push({ wch: 15 });
    });
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '2-Preços');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de preços:', error);
    throw error;
  }
}

async function addPlantingAreasSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar todas as safras e ordenar da menor para maior
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome', { ascending: true });
      
    if (safrasError) throw safrasError;
    
    // Buscar áreas de plantio usando a mesma estrutura do módulo de produção
    const { data: areas, error: areasError } = await supabase
      .from('areas_plantio')
      .select(`
        *,
        propriedades:propriedade_id(nome),
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome),
        ciclos:ciclo_id(nome)
      `)
      .eq('organizacao_id', organizationId);
      
    if (areasError) throw areasError;
    
    // Preparar dados para a planilha - apenas áreas por cultura e safra
    const plantingData = [
      ['ÁREAS DE PLANTIO'],
      [],
      ['ÁREAS POR CULTURA E SAFRA'],
      [],
      ['Cultura', 'Sistema', 'Ciclo', ...safras?.map((s: any) => s.nome) || []]
    ];
    
    if (areas && areas.length > 0) {
      // Agrupar por cultura/sistema/ciclo
      const plantioMap = new Map();
      areas.forEach((area: any) => {
        const chave = `${area.culturas?.nome}-${area.sistemas?.nome}-${area.ciclos?.nome}`;
        if (!plantioMap.has(chave)) {
          plantioMap.set(chave, {
            cultura: area.culturas?.nome,
            sistema: area.sistemas?.nome,
            ciclo: area.ciclos?.nome,
            areasPorSafra: new Map()
          });
        }
        
        // Extrair áreas por safra do JSONB (areas_por_safra)
        if (area.areas_por_safra && typeof area.areas_por_safra === 'object') {
          Object.entries(area.areas_por_safra).forEach(([safraId, areaValue]) => {
            const areaMap = plantioMap.get(chave).areasPorSafra;
            const currentArea = areaMap.get(safraId) || 0;
            const newArea = parseFloat(String(areaValue)) || 0;
            areaMap.set(safraId, currentArea + newArea);
          });
        }
      });
      
      const plantioArray = Array.from(plantioMap.values());
      
      // Adicionar linhas de dados
      plantioArray.forEach((grupo) => {
        const linha = [
          grupo.cultura || 'N/A',
          grupo.sistema || 'N/A',
          grupo.ciclo || 'N/A'
        ];
        
        // Para cada safra, buscar a área correspondente
        safras?.forEach((safra: any) => {
          const area = grupo.areasPorSafra.get(safra.id) || 0;
          linha.push(formatNumber(area, 2));
        });
        
        plantingData.push(linha);
      });
      
      // Adicionar linha de totais por safra
      const totalRow = ['TOTAL POR SAFRA', '', ''];
      safras?.forEach((safra: any) => {
        let total = 0;
        plantioArray.forEach((grupo) => {
          total += grupo.areasPorSafra.get(safra.id) || 0;
        });
        totalRow.push(formatNumber(total, 2));
      });
      plantingData.push(totalRow);
      
    } else {
      plantingData.push(['Nenhuma área de plantio cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(plantingData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 20 }, // Cultura
      { wch: 15 }, // Sistema
      { wch: 15 }  // Ciclo
    ];
    
    // Adicionar colunas para cada safra
    safras?.forEach(() => {
      colWidths.push({ wch: 12 });
    });
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '3-Áreas de Plantio');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de áreas de plantio:', error);
    throw error;
  }
}

async function addProductivitySheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar safras ordenadas
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome', { ascending: true });

    if (safrasError) throw safrasError;

    // Buscar dados de produtividade usando a mesma estrutura do módulo de produção
    const { data: producao, error: producaoError } = await supabase
      .from('produtividades')
      .select(`
        *,
        propriedades:propriedade_id(nome),
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome),
        ciclos:ciclo_id(nome)
      `)
      .eq('organizacao_id', organizationId)
      .not('produtividades_por_safra', 'eq', '{}');
      
    if (producaoError) throw producaoError;
    
    // Preparar dados para a planilha
    const productivityData = [
      ['PRODUTIVIDADE'],
      [],
      ['PRODUTIVIDADE POR CULTURA E SAFRA'],
      [],
      ['Propriedade', 'Cultura/Sistema/Ciclo', ...safras?.map((s: any) => s.nome) || []]
    ];
    
    if (producao && producao.length > 0 && safras && safras.length > 0) {
      // Agrupar produtividades por propriedade e cultura/sistema/ciclo
      const produtividadeMap = new Map();
      
      producao.forEach((prod: any) => {
        const culturaCompleta = `${prod.culturas?.nome} - ${prod.sistemas?.nome} - ${prod.ciclos?.nome}`;
        const propriedadeNome = prod.propriedades?.nome || 'Todas as Propriedades';
        const chave = `${propriedadeNome}-${culturaCompleta}`;
        
        if (!produtividadeMap.has(chave)) {
          produtividadeMap.set(chave, {
            propriedade: propriedadeNome,
            culturaCompleta: culturaCompleta,
            produtividadesPorSafra: new Map()
          });
        }
        
        // Extrair produtividades por safra do JSONB
        if (prod.produtividades_por_safra && typeof prod.produtividades_por_safra === 'object') {
          Object.entries(prod.produtividades_por_safra).forEach(([safraId, dadosProdutividade]) => {
            const prodMap = produtividadeMap.get(chave).produtividadesPorSafra;
            
            // Lidar com diferentes formatos do JSONB
            let produtividade = 0;
            let unidade = 'sc/ha';
            
            if (typeof dadosProdutividade === 'object' && dadosProdutividade !== null) {
              // Formato novo: { produtividade: number, unidade: string }
              produtividade = parseFloat((dadosProdutividade as any).produtividade) || 0;
              unidade = (dadosProdutividade as any).unidade || 'sc/ha';
            } else {
              // Formato legado: valor direto
              produtividade = parseFloat(String(dadosProdutividade)) || 0;
            }
            
            // Calcular média se já existe valor para esta safra
            const valorAtual = prodMap.get(safraId) || { total: 0, count: 0, unidade: unidade };
            valorAtual.total += produtividade;
            valorAtual.count += 1;
            valorAtual.unidade = unidade; // Manter a unidade mais recente
            prodMap.set(safraId, valorAtual);
          });
        }
      });

      // Criar linhas para a planilha
      const produtividadeArray = Array.from(produtividadeMap.values());
      
      produtividadeArray.forEach((grupo) => {
        const linha = [
          grupo.propriedade,
          grupo.culturaCompleta
        ];
        
        // Para cada safra, calcular a média de produtividade
        safras.forEach((safra: any) => {
          const dados = grupo.produtividadesPorSafra.get(safra.id);
          let valor = '-';
          
          if (dados && dados.count > 0) {
            const media = dados.total / dados.count;
            const unidade = dados.unidade || 'sc/ha';
            valor = `${formatNumber(media, 2)} ${unidade}`;
          }
          
          linha.push(valor);
        });
        
        productivityData.push(linha);
      });

    } else {
      productivityData.push(['Nenhum dado de produtividade cadastrado']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(productivityData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 25 }, // Propriedade
      { wch: 30 }  // Cultura/Sistema/Ciclo
    ];
    
    // Adicionar colunas para cada safra
    safras?.forEach(() => {
      colWidths.push({ wch: 15 });
    });
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '4-Produtividade');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de produtividade:', error);
    throw error;
  }
}

async function addProductionCostsSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar safras ordenadas
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome', { ascending: true });
      
    if (safrasError) throw safrasError;

    // Buscar custos de produção usando a mesma estrutura do módulo de produção
    const { data: custos, error: custosError } = await supabase
      .from('custos_producao')
      .select(`
        *,
        propriedades:propriedade_id(nome),
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome),
        ciclos:ciclo_id(nome)
      `)
      .eq('organizacao_id', organizationId)
      .not('custos_por_safra', 'eq', '{}');
      
    if (custosError) throw custosError;
    
    // Preparar dados para a planilha
    const costsData = [
      ['CUSTOS DE PRODUÇÃO'],
      [],
      ['CUSTOS POR CATEGORIA E SAFRA'],
      [],
      ['Propriedade', 'Cultura/Sistema/Ciclo', 'Categoria', 'Descrição', ...safras?.map((s: any) => s.nome) || []]
    ];
    
    if (custos && custos.length > 0) {
      // Agrupar custos por propriedade, cultura/sistema/ciclo e categoria
      const custosMap = new Map();
      
      custos.forEach((custo: any) => {
        const culturaCompleta = `${custo.culturas?.nome} - ${custo.sistemas?.nome} - ${custo.ciclos?.nome}`;
        const propriedadeNome = custo.propriedades?.nome || 'Todas as Propriedades';
        const categoria = custo.categoria || 'N/A';
        const descricao = custo.descricao || '';
        
        const chave = `${propriedadeNome}-${culturaCompleta}-${categoria}-${descricao}`;
        
        if (!custosMap.has(chave)) {
          custosMap.set(chave, {
            propriedade: propriedadeNome,
            culturaCompleta: culturaCompleta,
            categoria: categoria,
            descricao: descricao,
            custosPorSafra: new Map()
          });
        }
        
        // Extrair custos por safra do JSONB
        if (custo.custos_por_safra && typeof custo.custos_por_safra === 'object') {
          Object.entries(custo.custos_por_safra).forEach(([safraId, valor]) => {
            const custosMap_item = custosMap.get(chave);
            const currentValue = custosMap_item.custosPorSafra.get(safraId) || 0;
            const newValue = parseFloat(String(valor)) || 0;
            custosMap_item.custosPorSafra.set(safraId, currentValue + newValue);
          });
        }
      });
      
      const custosArray = Array.from(custosMap.values());
      
      // Adicionar linhas de dados
      custosArray.forEach((grupo) => {
        const linha = [
          grupo.propriedade,
          grupo.culturaCompleta,
          grupo.categoria,
          grupo.descricao
        ];
        
        // Para cada safra, buscar o custo correspondente
        safras?.forEach((safra: any) => {
          const custo = grupo.custosPorSafra.get(safra.id) || 0;
          linha.push(custo > 0 ? formatCurrency(custo) : '-');
        });
        
        costsData.push(linha);
      });
      
      // Adicionar linha de totais por safra
      const totalRow = ['TOTAL POR SAFRA', '', '', ''];
      safras?.forEach((safra: any) => {
        let total = 0;
        custosArray.forEach((grupo) => {
          total += grupo.custosPorSafra.get(safra.id) || 0;
        });
        totalRow.push(total > 0 ? formatCurrency(total) : '-');
      });
      costsData.push(totalRow);
      
    } else {
      costsData.push(['Nenhum custo de produção cadastrado']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(costsData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 25 }, // Propriedade
      { wch: 30 }, // Cultura/Sistema/Ciclo
      { wch: 20 }, // Categoria
      { wch: 25 }  // Descrição
    ];
    
    // Adicionar colunas para cada safra
    safras?.forEach(() => {
      colWidths.push({ wch: 15 });
    });
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '5-Custos de Produção');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de custos de produção:', error);
    throw error;
  }
}

async function addRealEstateSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar propriedades
    const { data: propriedades, error: propError } = await supabase
      .from('propriedades')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('nome');
      
    if (propError) throw propError;
    
    // Preparar dados para a planilha
    const realEstateData = [
      ['BENS IMÓVEIS'],
      [],
      ['PROPRIEDADES RURAIS'],
      [],
      ['Nome', 'Status', 'Tipo', 'Matrícula', 'Registro', 'Município', 'UF', 'Área Total (ha)', 'Área Cultivada (ha)', 'Área Pecuária (ha)', 'Área Preservação (ha)', 'Valor Total (R$)', 'Valor/ha (R$)']
    ];
    
    if (propriedades && propriedades.length > 0) {
      propriedades.forEach((prop: any) => {
        const area = parseFloat(prop.area_total) || 0;
        const areaCultivada = parseFloat(prop.area_cultivada) || 0;
        const areaPecuaria = parseFloat(prop.area_pecuaria) || 0;
        // Calcular área de preservação: área total - área cultivada - área pecuária
        const areaPreservacao = area > 0 ? Math.max(0, area - areaCultivada - areaPecuaria) : 0;
        const valorTotal = parseFloat(prop.valor_atual) || 0;
        const valorHa = area > 0 ? valorTotal / area : 0;
        
        realEstateData.push([
          prop.nome || 'N/A',
          prop.status || 'N/A',
          prop.tipo || 'N/A',
          prop.numero_matricula || 'N/A',
          prop.cartorio_registro || 'N/A',
          prop.cidade || 'N/A',
          prop.estado || 'N/A',
          formatNumber(area, 0),
          formatNumber(areaCultivada, 0),
          formatNumber(areaPecuaria, 0),
          formatNumber(areaPreservacao, 0),
          formatCurrency(valorTotal),
          formatCurrency(valorHa)
        ]);
      });
    } else {
      realEstateData.push(['Nenhuma propriedade cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(realEstateData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 25 }, // Nome
      { wch: 15 }, // Status
      { wch: 15 }, // Tipo
      { wch: 15 }, // Matrícula
      { wch: 15 }, // Registro
      { wch: 20 }, // Município
      { wch: 10 }, // UF
      { wch: 15 }, // Área Total
      { wch: 15 }, // Área Cultivada
      { wch: 15 }, // Área Pecuária
      { wch: 15 }, // Área Preservação
      { wch: 20 }, // Valor Total
      { wch: 15 }  // Valor/ha
    ];
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '6-Bens Imóveis');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de bens imóveis:', error);
    throw error;
  }
}

async function addLeaseSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar safras ordenadas
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome', { ascending: true });
      
    if (safrasError) throw safrasError;

    // Buscar propriedades arrendadas
    const { data: propriedadesArrendadas, error: propError } = await supabase
      .from('propriedades')
      .select('*')
      .eq('organizacao_id', organizationId)
      .eq('tipo', 'ARRENDADO')
      .order('nome');
      
    if (propError) throw propError;
    
    // Preparar dados para a planilha - formato com safras como colunas
    const leaseData = [
      ['ARRENDAMENTOS'],
      [],
      ['VALORES DE ARRENDAMENTO POR SAFRA'],
      [],
      ['Propriedade', 'Arrendantes', 'Data Início', 'Data Fim', 'Área (ha)', 'Custo/ha', ...safras?.map((s: any) => s.nome) || [], 'Status']
    ];
    
    if (propriedadesArrendadas && propriedadesArrendadas.length > 0) {
      propriedadesArrendadas.forEach((prop: any) => {
        const linha = [
          prop.nome || 'N/A',
          prop.arrendantes || 'N/A',
          prop.data_inicio ? new Date(prop.data_inicio).toLocaleDateString('pt-BR') : 'N/A',
          prop.data_termino ? new Date(prop.data_termino).toLocaleDateString('pt-BR') : 'N/A',
          formatNumber(parseFloat(prop.area_total) || 0, 0),
          formatCurrency(parseFloat(prop.custo_hectare) || 0)
        ];
        
        // Adicionar valores por safra
        let totalArrendamento = 0;
        safras?.forEach((safra: any) => {
          let valorSafra = 0;
          
          // Verificar em custos_por_safra (formato JSONB)
          if (prop.custos_por_safra && typeof prop.custos_por_safra === 'object') {
            valorSafra = parseFloat(prop.custos_por_safra[safra.id]) || 0;
          }
          
          totalArrendamento += valorSafra;
          linha.push(valorSafra > 0 ? formatCurrency(valorSafra) : '-');
        });
        
        // Adicionar status
        linha.push(prop.status || 'ATIVA');
        
        leaseData.push(linha);
      });
      
      // Adicionar linha de totais
      const totalRow = ['TOTAL', '', '', '', '', ''];
      safras?.forEach((safra: any) => {
        let totalSafra = 0;
        propriedadesArrendadas.forEach((prop: any) => {
          if (prop.custos_por_safra && typeof prop.custos_por_safra === 'object') {
            totalSafra += parseFloat(prop.custos_por_safra[safra.id]) || 0;
          }
        });
        totalRow.push(totalSafra > 0 ? formatCurrency(totalSafra) : '-');
      });
      totalRow.push('');
      leaseData.push(totalRow);
      
    } else {
      leaseData.push(['Nenhuma propriedade arrendada cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(leaseData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 25 }, // Propriedade
      { wch: 25 }, // Arrendantes
      { wch: 12 }, // Data Início
      { wch: 12 }, // Data Fim
      { wch: 12 }, // Área
      { wch: 12 }  // Custo/ha
    ];
    
    // Adicionar colunas para cada safra
    safras?.forEach(() => {
      colWidths.push({ wch: 15 });
    });
    
    colWidths.push({ wch: 12 }); // Status
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '7-Arrendamentos');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de arrendamentos:', error);
    throw error;
  }
}

async function addEquipmentSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar equipamentos
    const { data: equipamentos, error: equipError } = await supabase
      .from('maquinas_equipamentos')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('equipamento');
      
    if (equipError) throw equipError;
    
    // Preparar dados para a planilha
    const equipmentData = [
      ['EQUIPAMENTOS'],
      [],
      ['INVENTÁRIO DE EQUIPAMENTOS'],
      [],
      ['Equipamento', 'Marca', 'Modelo', 'Ano Fabricação', 'Quantidade', 'Valor Unitário (R$)', 'Valor Total (R$)', 'Valor Reposição SR (R$)', 'Alienado', 'Nº Chassi', 'Nº Série']
    ];
    
    if (equipamentos && equipamentos.length > 0) {
      equipamentos.forEach((equip: any) => {
        const quantidade = parseInt(equip.quantidade) || 1;
        const valorUnitario = parseFloat(equip.valor_unitario) || 0;
        const valorTotal = parseFloat(equip.valor_total) || 0;
        const valorReposicao = parseFloat(equip.reposicao_sr) || 0;
        
        equipmentData.push([
          equip.equipamento || 'N/A',
          equip.marca || 'N/A',
          equip.modelo || 'N/A',
          equip.ano_fabricacao || 'N/A',
          formatNumber(quantidade),
          formatCurrency(valorUnitario),
          formatCurrency(valorTotal),
          formatCurrency(valorReposicao),
          equip.alienado ? 'Sim' : 'Não',
          equip.numero_chassi || 'N/A',
          equip.numero_serie || 'N/A'
        ]);
      });
      
    } else {
      equipmentData.push(['Nenhum equipamento cadastrado']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(equipmentData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 20 }, // Tipo
      { wch: 30 }, // Nome/Modelo
      { wch: 15 }, // Marca
      { wch: 10 }, // Ano
      { wch: 15 }, // Estado
      { wch: 25 }, // Propriedade
      { wch: 20 }, // Valor Aquisição
      { wch: 20 }, // Valor Atual
      { wch: 20 }, // Depreciação
      { wch: 12 }  // Status
    ];
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '8-Equipamentos');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de equipamentos:', error);
    throw error;
  }
}

async function addInvestmentsSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar investimentos
    const { data: investimentos, error: investError } = await supabase
      .from('investimentos')
      .select(`
        *,
        safras (nome)
      `)
      .eq('organizacao_id', organizationId)
      .order('categoria');
      
    if (investError) throw investError;
    
    // Preparar dados para a planilha
    const investmentData = [
      ['INVESTIMENTOS'],
      [],
      ['HISTÓRICO DE INVESTIMENTOS'],
      [],
      ['Categoria', 'Tipo', 'Safra', 'Ano', 'Quantidade', 'Valor Unitário (R$)', 'Valor Total (R$)']
    ];
    
    if (investimentos && investimentos.length > 0) {
      investimentos.forEach((invest: any) => {
        const quantidade = parseInt(invest.quantidade) || 0;
        const valorUnitario = parseFloat(invest.valor_unitario) || 0;
        const valorTotal = parseFloat(invest.valor_total) || 0;
        
        investmentData.push([
          formatCategoriaInvestimento(invest.categoria),
          invest.tipo || 'N/A',
          invest.safras?.nome || 'N/A',
          invest.ano || 'N/A',
          formatNumber(quantidade),
          formatCurrency(valorUnitario),
          formatCurrency(valorTotal)
        ]);
      });
      
    } else {
      investmentData.push(['Nenhum investimento cadastrado']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(investmentData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 20 }, // Categoria
      { wch: 25 }, // Tipo
      { wch: 15 }, // Safra
      { wch: 10 }, // Ano
      { wch: 15 }, // Quantidade
      { wch: 20 }, // Valor Unitário
      { wch: 20 }  // Valor Total
    ];
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '9-Investimentos');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de investimentos:', error);
    throw error;
  }
}

async function addAssetSalesSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar todas as safras
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('id, nome, ano_inicio')
      .eq('organizacao_id', organizationId)
      .order('ano_inicio', { ascending: false });
      
    if (safrasError) throw safrasError;
    
    // Criar mapa de safra_id -> nome
    const safraMap = new Map();
    safras?.forEach((safra: any) => {
      safraMap.set(safra.id, safra.nome);
    });
    
    // Buscar vendas de ativos
    const { data: vendas, error: vendasError } = await supabase
      .from('vendas_ativos')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('data_venda', { ascending: false });
      
    if (vendasError) throw vendasError;
    
    // Preparar dados para a planilha
    const salesData = [
      ['VENDAS DE ATIVOS'],
      [],
      ['HISTÓRICO DE VENDAS'],
      [],
      ['Data', 'Safra', 'Categoria', 'Descrição', 'Quantidade', 'Valor Unit. (R$)', 'Valor Total (R$)', 'Ano']
    ];
    
    const anoAtual = new Date().getFullYear();
    
    if (vendas && vendas.length > 0) {
      vendas.forEach((venda: any) => {
        const valorTotal = parseFloat(venda.valor_total) || 0;
        
        salesData.push([
          venda.data_venda ? new Date(venda.data_venda).toLocaleDateString('pt-BR') : 'N/A',
          safraMap.get(venda.safra_id) || 'N/A',
          formatCategoriaVenda(venda.categoria),
          venda.descricao || 'N/A',
          formatNumber(venda.quantidade || 0),
          formatCurrency(venda.valor_unitario || 0),
          formatCurrency(valorTotal),
          venda.ano || 'N/A'
        ]);
      });
      
    } else {
      salesData.push(['Nenhuma venda de ativo cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(salesData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 15 }, // Data
      { wch: 15 }, // Safra
      { wch: 20 }, // Categoria
      { wch: 40 }, // Descrição
      { wch: 12 }, // Quantidade
      { wch: 18 }, // Valor Unit.
      { wch: 18 }, // Valor Total
      { wch: 10 }  // Ano
    ];
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '10-Vendas de Ativos');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de vendas de ativos:', error);
    throw error;
  }
}

async function addBankDebtsSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar dívidas bancárias
    const { data: dividas, error: dividasError } = await supabase
      .from('dividas_bancarias')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('created_at');
      
    if (dividasError) throw dividasError;
    
    // Preparar dados para a planilha
    const debtsData = [
      ['DÍVIDAS BANCÁRIAS'],
      [],
      ['CONTRATOS BANCÁRIOS'],
      [],
      ['Instituição Bancária', 'Tipo', 'Modalidade', 'Valor Principal', 'Ano Contratação', 'Taxa Real (%)', 'Indexador', 'Moeda', 'Status', 'Observações']
    ];
    
    if (dividas && dividas.length > 0) {
      dividas.forEach((divida: any) => {
        debtsData.push([
          divida.instituicao_bancaria || 'N/A',
          divida.tipo || 'N/A',
          divida.modalidade || 'N/A',
          formatCurrency(divida.valor_principal || 0),
          divida.ano_contratacao || 'N/A',
          formatNumber(divida.taxa_real || 0, 2) + '%',
          divida.indexador || 'N/A',
          divida.moeda || 'N/A',
          divida.status || 'N/A',
          divida.observacoes || 'N/A'
        ]);
      });
    } else {
      debtsData.push(['Nenhuma dívida bancária cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(debtsData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 25 }, // Instituição Bancária
      { wch: 15 }, // Tipo
      { wch: 15 }, // Modalidade
      { wch: 18 }, // Valor Principal
      { wch: 15 }, // Ano Contratação
      { wch: 12 }, // Taxa Real
      { wch: 15 }, // Indexador
      { wch: 10 }, // Moeda
      { wch: 12 }, // Status
      { wch: 30 }  // Observações
    ];
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '11-Dívidas Bancárias');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de dívidas bancárias:', error);
    throw error;
  }
}

async function addLandDebtsSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar aquisições de terras (tabela atual usada no módulo financeiro)
    const { data: aquisicaoTerras, error: aquisicaoError } = await supabase
      .from('aquisicao_terras')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('created_at', { ascending: false });
      
    if (aquisicaoError) throw aquisicaoError;
    
    // Buscar propriedades para cruzar informações
    const { data: propriedades, error: propError } = await supabase
      .from('propriedades')
      .select('id, nome, area_total, cidade, estado')
      .eq('organizacao_id', organizationId);
      
    if (propError) throw propError;
    
    // Criar mapa de propriedades por nome
    const propriedadesMap = new Map();
    propriedades?.forEach((prop: any) => {
      propriedadesMap.set(prop.nome.toLowerCase(), prop);
    });
    
    // Preparar dados para a planilha
    const landDebtsData = [
      ['DÍVIDAS DE TERRAS'],
      [],
      ['CONTRATOS DE TERRAS'],
      [],
      ['Propriedade', 'Credor', 'Tipo Dívida', 'Ano Aquisição', 'Valor Total', 'Moeda', 'Área (ha)', 'Cidade', 'Estado']
    ];
    
    if (aquisicaoTerras && aquisicaoTerras.length > 0) {
      aquisicaoTerras.forEach((aquisicao: any) => {
        // Buscar propriedade correspondente pelo nome
        const propriedade = propriedadesMap.get(aquisicao.nome_fazenda?.toLowerCase());
        
        // Determinar o tipo de dívida baseado no tipo de aquisição
        let tipoDivida = 'FINANCIAMENTO_AQUISICAO';
        if (aquisicao.tipo === 'PARCERIA') {
          tipoDivida = 'PARCERIA_AGRICOLA';
        } else if (aquisicao.tipo === 'OUTROS') {
          tipoDivida = 'OUTROS';
        }
        
        // Usar o nome da fazenda como credor se não houver campo específico
        const credor = aquisicao.credor || aquisicao.nome_fazenda?.toUpperCase() || 'N/A';
        
        landDebtsData.push([
          aquisicao.nome_fazenda || 'N/A',
          credor,
          tipoDivida,
          aquisicao.ano || 'N/A',
          formatCurrency(parseFloat(aquisicao.valor_total) || 0),
          'BRL', // Moeda padrão
          formatNumber(parseFloat(aquisicao.hectares) || propriedade?.area_total || 0, 0),
          propriedade?.cidade || 'N/A',
          propriedade?.estado || 'N/A'
        ]);
      });
    } else {
      landDebtsData.push(['Nenhuma dívida de terra cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(landDebtsData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 25 }, // Propriedade
      { wch: 25 }, // Credor
      { wch: 25 }, // Tipo Dívida
      { wch: 15 }, // Ano Aquisição
      { wch: 20 }, // Valor Total
      { wch: 10 }, // Moeda
      { wch: 15 }, // Área
      { wch: 20 }, // Cidade
      { wch: 10 }  // Estado
    ];
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '12-Dívidas de Terras');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de dívidas de terras:', error);
    throw error;
  }
}

async function addSupplierDebtsSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar dívidas de fornecedores
    const { data: dividasFornecedores, error: dividasError } = await supabase
      .from('dividas_fornecedores')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('nome');
      
    if (dividasError) throw dividasError;
    
    // Preparar dados para a planilha
    const supplierDebtsData = [
      ['DÍVIDAS DE FORNECEDORES'],
      [],
      ['CONTRATOS COM FORNECEDORES'],
      [],
      ['Fornecedor', 'Categoria', 'Moeda', 'Valor Total']
    ];
    
    if (dividasFornecedores && dividasFornecedores.length > 0) {
      dividasFornecedores.forEach((divida: any) => {
        // Calcular total por fornecedor
        const valorTotal = Object.values(divida.valores_por_ano || {}).reduce((sum: number, val: any) => 
          sum + (parseFloat(val) || 0), 0
        );
        
        supplierDebtsData.push([
          divida.nome || 'N/A',
          formatCategoriaFornecedor(divida.categoria),
          divida.moeda || 'BRL',
          formatCurrency(valorTotal)
        ]);
      });
    } else {
      supplierDebtsData.push(['Nenhuma dívida de fornecedor cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(supplierDebtsData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 30 }, // Fornecedor
      { wch: 25 }, // Categoria
      { wch: 10 }, // Moeda
      { wch: 20 }  // Valor Total
    ];
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '13-Dívidas de Fornecedores');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de dívidas de fornecedores:', error);
    throw error;
  }
}

async function addCashAvailabilitySheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar safras ordenadas
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome', { ascending: true });
      
    if (safrasError) throw safrasError;

    // Buscar caixa e disponibilidades
    const { data: caixaDisponibilidades, error: caixaError } = await supabase
      .from('caixa_disponibilidades')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('categoria');
      
    if (caixaError) throw caixaError;
    
    // Preparar dados para a planilha - formato com safras como colunas
    const cashData = [
      ['CAIXA E DISPONIBILIDADES'],
      [],
      ['POSIÇÃO FINANCEIRA POR SAFRA'],
      [],
      ['Categoria', 'Descrição', ...safras?.map((s: any) => s.nome) || [], 'Total']
    ];
    
    // Mapear nomes de categoria amigáveis
    const categoriaNames: Record<string, string> = {
      'CAIXA_BANCOS': 'Caixa, Bancos e Aplicações',
      'CLIENTES': 'Valores a Receber',
      'ADIANTAMENTOS': 'Adiantamentos a Fornecedores',
      'EMPRESTIMOS': 'Empréstimos a Terceiros',
      'ESTOQUE_DEFENSIVOS': 'Estoques de Defensivos',
      'ESTOQUE_FERTILIZANTES': 'Estoques de Fertilizantes',
      'ESTOQUE_ALMOXARIFADO': 'Estoques de Almoxarifado',
      'ESTOQUE_COMMODITIES': 'Estoques de Commodities',
      'ESTOQUE_SEMENTES': 'Estoques de Sementes',
      'SEMOVENTES': 'Rebanho (Semoventes)',
      'ATIVO_BIOLOGICO': 'Ativo Biológico'
    };
    
    if (caixaDisponibilidades && caixaDisponibilidades.length > 0) {
      caixaDisponibilidades.forEach((item: any) => {
        const linha = [
          categoriaNames[item.categoria] || item.categoria || 'N/A',
          item.nome || '-'
        ];
        
        let totalItem = 0;
        
        // Adicionar valores por safra
        safras?.forEach((safra: any) => {
          let valorSafra = 0;
          
          // Verificar em valores_por_ano (formato JSONB)
          if (item.valores_por_ano && typeof item.valores_por_ano === 'object') {
            valorSafra = parseFloat(item.valores_por_ano[safra.id]) || 0;
          }
          
          totalItem += valorSafra;
          linha.push(valorSafra > 0 ? formatCurrency(valorSafra) : '-');
        });
        
        // Adicionar total
        linha.push(totalItem > 0 ? formatCurrency(totalItem) : '-');
        
        cashData.push(linha);
      });
      
      // Adicionar linha de totais por safra
      const totalRow = ['TOTAL GERAL', ''];
      let grandTotal = 0;
      
      safras?.forEach((safra: any) => {
        let totalSafra = 0;
        caixaDisponibilidades.forEach((item: any) => {
          if (item.valores_por_ano && typeof item.valores_por_ano === 'object') {
            totalSafra += parseFloat(item.valores_por_ano[safra.id]) || 0;
          }
        });
        grandTotal += totalSafra;
        totalRow.push(totalSafra > 0 ? formatCurrency(totalSafra) : '-');
      });
      
      totalRow.push(grandTotal > 0 ? formatCurrency(grandTotal) : '-');
      cashData.push(totalRow);
      
    } else {
      cashData.push(['Nenhuma disponibilidade cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(cashData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 30 }, // Categoria
      { wch: 40 }  // Descrição
    ];
    
    // Adicionar colunas para cada safra
    safras?.forEach(() => {
      colWidths.push({ wch: 18 });
    });
    
    colWidths.push({ wch: 18 }); // Total
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '14-Caixa e Disponibilidades');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de caixa e disponibilidades:', error);
    throw error;
  }
}

async function addFinancialOperationsSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar safras ordenadas
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome', { ascending: true });
      
    if (safrasError) throw safrasError;

    // Buscar operações financeiras
    const { data: operacoes, error: operacoesError } = await supabase
      .from('financeiras')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('categoria', { ascending: true })
      .order('nome', { ascending: true });
      
    if (operacoesError) throw operacoesError;
    
    // Preparar dados para a planilha - formato com safras como colunas
    const financialData = [
      ['OPERAÇÕES FINANCEIRAS'],
      [],
      ['HISTÓRICO DE OPERAÇÕES POR SAFRA'],
      [],
      ['Categoria', 'Nome', ...safras?.map((s: any) => s.nome) || [], 'Total']
    ];
    
    // Mapear nomes de categoria amigáveis
    const categoriaNames: Record<string, string> = {
      'COMPRA_PRODUCAO': 'Compra de Produção',
      'ARMAZENAGEM': 'Armazenagem',
      'FRETE': 'Frete',
      'JUROS': 'Juros',
      'SEGURO': 'Seguro',
      'CONSULTORIA': 'Consultoria',
      'OUTROS': 'Outros'
    };
    
    if (operacoes && operacoes.length > 0) {
      operacoes.forEach((op: any) => {
        const linha = [
          categoriaNames[op.categoria] || op.categoria || 'N/A',
          op.nome || '-'
        ];
        
        let totalItem = 0;
        
        // Adicionar valores por safra
        safras?.forEach((safra: any) => {
          let valorSafra = 0;
          
          // Verificar em valores_por_ano (formato JSONB)
          if (op.valores_por_ano && typeof op.valores_por_ano === 'object') {
            valorSafra = parseFloat(op.valores_por_ano[safra.id]) || 0;
          }
          
          totalItem += valorSafra;
          linha.push(valorSafra > 0 ? formatCurrency(valorSafra) : '-');
        });
        
        // Adicionar total
        linha.push(totalItem > 0 ? formatCurrency(totalItem) : '-');
        
        financialData.push(linha);
      });
      
      // Adicionar linha de totais por safra
      const totalRow = ['TOTAL GERAL', ''];
      let grandTotal = 0;
      
      safras?.forEach((safra: any) => {
        let totalSafra = 0;
        operacoes.forEach((op: any) => {
          if (op.valores_por_ano && typeof op.valores_por_ano === 'object') {
            totalSafra += parseFloat(op.valores_por_ano[safra.id]) || 0;
          }
        });
        grandTotal += totalSafra;
        totalRow.push(totalSafra > 0 ? formatCurrency(totalSafra) : '-');
      });
      
      totalRow.push(grandTotal > 0 ? formatCurrency(grandTotal) : '-');
      financialData.push(totalRow);
      
    } else {
      financialData.push(['Nenhuma operação financeira cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(financialData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 25 }, // Categoria
      { wch: 35 }  // Nome
    ];
    
    // Adicionar colunas para cada safra
    safras?.forEach(() => {
      colWidths.push({ wch: 18 });
    });
    
    colWidths.push({ wch: 18 }); // Total
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '15-Operações Financeiras');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de operações financeiras:', error);
    throw error;
  }
}

async function addOtherExpensesSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar safras ordenadas
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome', { ascending: true });
      
    if (safrasError) throw safrasError;

    // Buscar outras despesas
    const { data: outrasDespesas, error: despesasError } = await supabase
      .from('outras_despesas')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('categoria', { ascending: true })
      .order('descricao', { ascending: true });
      
    if (despesasError) throw despesasError;
    
    // Preparar dados para a planilha - formato com safras como colunas
    const expensesData = [
      ['OUTRAS DESPESAS'],
      [],
      ['HISTÓRICO DE DESPESAS POR SAFRA'],
      [],
      ['Categoria', 'Descrição', ...safras?.map((s: any) => s.nome) || [], 'Total']
    ];
    
    // Mapear nomes de categoria amigáveis
    const categoriaNames: Record<string, string> = {
      'ADMINISTRATIVO': 'Despesas Administrativas',
      'TRIBUTARIO': 'Despesas Tributárias',
      'PESSOAL': 'Despesas com Pessoal',
      'SEGUROS': 'Seguros',
      'HONORARIOS': 'Honorários',
      'CONSERVACAO': 'Conservação e Manutenção',
      'ENERGIA': 'Energia',
      'COMUNICACAO': 'Comunicação',
      'VIAGENS': 'Viagens',
      'OUTROS': 'Outras Despesas'
    };
    
    if (outrasDespesas && outrasDespesas.length > 0) {
      outrasDespesas.forEach((despesa: any) => {
        const linha = [
          categoriaNames[despesa.categoria] || despesa.categoria || 'N/A',
          despesa.descricao || '-'
        ];
        
        let totalItem = 0;
        
        // Adicionar valores por safra
        safras?.forEach((safra: any) => {
          let valorSafra = 0;
          
          // Verificar em valores_por_ano (formato JSONB)
          if (despesa.valores_por_ano && typeof despesa.valores_por_ano === 'object') {
            valorSafra = parseFloat(despesa.valores_por_ano[safra.id]) || 0;
          }
          
          totalItem += valorSafra;
          linha.push(valorSafra > 0 ? formatCurrency(valorSafra) : '-');
        });
        
        // Adicionar total
        linha.push(totalItem > 0 ? formatCurrency(totalItem) : '-');
        
        expensesData.push(linha);
      });
      
      // Adicionar linha de totais por safra
      const totalRow = ['TOTAL GERAL', ''];
      let grandTotal = 0;
      
      safras?.forEach((safra: any) => {
        let totalSafra = 0;
        outrasDespesas.forEach((despesa: any) => {
          if (despesa.valores_por_ano && typeof despesa.valores_por_ano === 'object') {
            totalSafra += parseFloat(despesa.valores_por_ano[safra.id]) || 0;
          }
        });
        grandTotal += totalSafra;
        totalRow.push(totalSafra > 0 ? formatCurrency(totalSafra) : '-');
      });
      
      totalRow.push(grandTotal > 0 ? formatCurrency(grandTotal) : '-');
      expensesData.push(totalRow);
      
    } else {
      expensesData.push(['Nenhuma despesa cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(expensesData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 30 }, // Categoria
      { wch: 40 }  // Descrição
    ];
    
    // Adicionar colunas para cada safra
    safras?.forEach(() => {
      colWidths.push({ wch: 18 });
    });
    
    colWidths.push({ wch: 18 }); // Total
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '16-Outras Despesas');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de outras despesas:', error);
    throw error;
  }
}

async function addOtherRevenuesSheet(wb: XLSX.WorkBook, supabase: any, organizationId: string) {
  try {
    // Buscar safras ordenadas
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome', { ascending: true });
      
    if (safrasError) throw safrasError;

    // Buscar outras receitas
    const { data: receitasFinanceiras, error: receitasError } = await supabase
      .from('receitas_financeiras')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('categoria', { ascending: true })
      .order('descricao', { ascending: true });
      
    if (receitasError) throw receitasError;
    
    // Preparar dados para a planilha - formato com safras como colunas
    const revenuesData = [
      ['OUTRAS RECEITAS'],
      [],
      ['HISTÓRICO DE RECEITAS POR SAFRA'],
      [],
      ['Categoria', 'Descrição', ...safras?.map((s: any) => s.nome) || [], 'Total']
    ];
    
    // Mapear nomes de categoria amigáveis
    const categoriaNames: Record<string, string> = {
      'VENDA_PRODUCAO': 'Venda de Produção',
      'ARRENDAMENTO': 'Arrendamento',
      'PRESTACAO_SERVICOS': 'Prestação de Serviços',
      'RENDIMENTOS_FINANCEIROS': 'Rendimentos Financeiros',
      'VENDA_ATIVOS': 'Venda de Ativos',
      'INDENIZACOES': 'Indenizações',
      'SUBSIDIOS': 'Subsídios',
      'OUTROS': 'Outras Receitas'
    };
    
    if (receitasFinanceiras && receitasFinanceiras.length > 0) {
      // Agrupar receitas por categoria e descrição
      const receitasMap = new Map();
      
      receitasFinanceiras.forEach((receita: any) => {
        const categoria = categoriaNames[receita.categoria] || receita.categoria || 'N/A';
        const descricao = receita.descricao || '-';
        const chave = `${categoria}-${descricao}`;
        
        if (!receitasMap.has(chave)) {
          receitasMap.set(chave, {
            categoria: categoria,
            descricao: descricao,
            valoresPorSafra: new Map()
          });
        }
        
        // Se há safra_id, adicionar valor à safra correspondente
        if (receita.safra_id && receita.valor) {
          const receitaItem = receitasMap.get(chave);
          const valorAtual = receitaItem.valoresPorSafra.get(receita.safra_id) || 0;
          receitaItem.valoresPorSafra.set(receita.safra_id, valorAtual + parseFloat(receita.valor));
        }
        
        // Se há valores_por_safra (JSONB), processar
        if (receita.valores_por_safra && typeof receita.valores_por_safra === 'object') {
          Object.entries(receita.valores_por_safra).forEach(([safraId, valor]) => {
            const receitaItem = receitasMap.get(chave);
            const valorAtual = receitaItem.valoresPorSafra.get(safraId) || 0;
            receitaItem.valoresPorSafra.set(safraId, valorAtual + parseFloat(String(valor)));
          });
        }
      });
      
      // Converter para array e adicionar linhas
      const receitasArray = Array.from(receitasMap.values());
      
      receitasArray.forEach((grupo) => {
        const linha = [
          grupo.categoria,
          grupo.descricao
        ];
        
        let totalItem = 0;
        
        // Adicionar valores por safra
        safras?.forEach((safra: any) => {
          const valor = grupo.valoresPorSafra.get(safra.id) || 0;
          totalItem += valor;
          linha.push(valor > 0 ? formatCurrency(valor) : '-');
        });
        
        // Adicionar total
        linha.push(totalItem > 0 ? formatCurrency(totalItem) : '-');
        
        revenuesData.push(linha);
      });
      
      // Adicionar linha de totais por safra
      const totalRow = ['TOTAL GERAL', ''];
      let grandTotal = 0;
      
      safras?.forEach((safra: any) => {
        let totalSafra = 0;
        receitasArray.forEach((grupo) => {
          totalSafra += grupo.valoresPorSafra.get(safra.id) || 0;
        });
        grandTotal += totalSafra;
        totalRow.push(totalSafra > 0 ? formatCurrency(totalSafra) : '-');
      });
      
      totalRow.push(grandTotal > 0 ? formatCurrency(grandTotal) : '-');
      revenuesData.push(totalRow);
      
    } else {
      revenuesData.push(['Nenhuma receita cadastrada']);
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(revenuesData);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 30 }, // Categoria
      { wch: 40 }  // Descrição
    ];
    
    // Adicionar colunas para cada safra
    safras?.forEach(() => {
      colWidths.push({ wch: 18 });
    });
    
    colWidths.push({ wch: 18 }); // Total
    
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, '17-Outras Receitas');
    
  } catch (error) {
    console.error('Erro ao adicionar aba de outras receitas:', error);
    throw error;
  }
}

// Funções auxiliares para formatação
function formatNumber(value: number, decimals: number = 0): string {
  if (isNaN(value)) return '0';
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatCurrency(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatCategoriaInvestimento(categoria: string): string {
  const categorias: { [key: string]: string } = {
    'MAQUINAS': 'Máquinas e Equipamentos',
    'INFRAESTRUTURA': 'Infraestrutura',
    'TECNOLOGIA': 'Tecnologia',
    'MELHORAMENTO': 'Melhoramento Genético',
    'OUTRO': 'Outros'
  };
  
  return categorias[categoria] || categoria;
}

function formatCategoriaVenda(categoria: string): string {
  const categorias: { [key: string]: string } = {
    'MAQUINAS': 'Máquinas e Equipamentos',
    'VEICULOS': 'Veículos',
    'IMOVEIS': 'Imóveis',
    'ANIMAIS': 'Animais',
    'OUTROS': 'Outros'
  };
  
  return categorias[categoria] || categoria;
}

function formatCategoriaFornecedor(categoria: string): string {
  const categorias: { [key: string]: string } = {
    'INSUMOS': 'Insumos Agrícolas',
    'COMBUSTIVEL': 'Combustível',
    'MANUTENCAO': 'Manutenção',
    'SERVICOS': 'Serviços',
    'OUTROS': 'Outros'
  };
  
  return categorias[categoria] || categoria;
}