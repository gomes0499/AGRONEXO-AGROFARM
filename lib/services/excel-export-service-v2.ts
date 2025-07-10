import * as XLSX from 'xlsx';
import { getProperties } from "@/lib/actions/property-actions";
import { 
  getProductionDataUnified,
  getPlantingAreasUnified,
  getProductivitiesUnified,
  getProductionCostsUnified,
} from "@/lib/actions/production-actions";
import { getDividasBancarias } from "@/lib/actions/financial-actions/dividas-bancarias";
import { getDividasTerras } from "@/lib/actions/financial-actions/dividas-terras";
import { getDividasFornecedores } from "@/lib/actions/financial-actions/dividas-fornecedores";
import { getCaixaDisponibilidades } from "@/lib/actions/financial-actions/caixa-disponibilidades";
import { getFinanceiras } from "@/lib/actions/financial-actions/financeiras";
import { getOutrasDespesas } from "@/lib/actions/financial-actions/outras-despesas";
import { getReceitasFinanceiras } from "@/lib/actions/financial-actions/receitas-financeiras-actions";
import { formatCurrency, formatArea } from "@/lib/utils/property-formatters";
import { getFluxoCaixaCorrigido } from "@/lib/actions/projections-actions/fluxo-caixa-corrigido";
import { getDREDataUpdated } from "@/lib/actions/projections-actions/dre-data-updated";
import { getBalancoPatrimonialCorrigido } from "@/lib/actions/projections-actions/balanco-patrimonial-corrigido";
import { fetchDashboardData } from "@/lib/actions/dashboard/dashboard-actions";
import {
  getMaquinasEquipamentos,
  getBenfeitorias,
  getInvestimentos,
  getRebanhos,
  getAssociacoes,
  getAquisicaoTerras,
  getArrendamentos,
  getPrecos,
  getCotacoesCambio,
  getAdiantamentos,
} from "@/lib/actions/assets-actions";

export async function generateExcelExportV2(organizationId: string): Promise<Blob> {
  try {
    // Buscar todos os dados da organização incluindo dashboard e tabelas adicionais
    const [
      dashboardData,
      properties,
      productionData,
      plantingAreasData,
      productivitiesData,
      productionCostsData,
      bankDebts,
      landDebts,
      supplierDebts,
      cashAvailability,
      financialOperations,
      otherExpenses,
      financialRevenues,
      cashFlowData,
      dreData,
      balanceSheetData,
      // Novos dados
      maquinasEquipamentos,
      benfeitorias,
      investimentos,
      rebanhos,
      associacoes,
      aquisicaoTerras,
      arrendamentos,
      precos,
      cotacoesCambio,
      adiantamentos,
    ] = await Promise.all([
      fetchDashboardData(organizationId).catch(() => null),
      getProperties(organizationId).catch(() => []),
      getProductionDataUnified(organizationId).catch(() => ({ properties: [], cultures: [], systems: [], cycles: [], safras: [] })),
      getPlantingAreasUnified(organizationId).catch(() => ({ plantingAreas: [], safras: [] })),
      getProductivitiesUnified(organizationId).catch(() => ({ productivities: [], safras: [] })),
      getProductionCostsUnified(organizationId).catch(() => ({ productionCosts: [], safras: [] })),
      getDividasBancarias(organizationId).catch(() => []),
      getDividasTerras(organizationId).catch(() => []),
      getDividasFornecedores(organizationId).catch(() => []),
      getCaixaDisponibilidades(organizationId).catch(() => []),
      getFinanceiras(organizationId).catch(() => []),
      getOutrasDespesas(organizationId).catch(() => []),
      getReceitasFinanceiras(organizationId).catch(() => []),
      getFluxoCaixaCorrigido(organizationId).catch(() => null),
      getDREDataUpdated(organizationId).catch(() => null),
      getBalancoPatrimonialCorrigido(organizationId).catch(() => null),
      // Novos dados
      getMaquinasEquipamentos(organizationId).catch(() => []),
      getBenfeitorias(organizationId).catch(() => []),
      getInvestimentos(organizationId).catch(() => []),
      getRebanhos(organizationId).catch(() => []),
      getAssociacoes(organizationId).catch(() => []),
      getAquisicaoTerras(organizationId).catch(() => []),
      getArrendamentos(organizationId).catch(() => []),
      getPrecos(organizationId).catch(() => []),
      getCotacoesCambio(organizationId).catch(() => []),
      getAdiantamentos(organizationId).catch(() => []),
    ]);

    // Extrair os arrays dos objetos retornados
    const plantingAreas = plantingAreasData?.plantingAreas || [];
    const productivities = productivitiesData?.productivities || [];
    const productionCosts = productionCostsData?.productionCosts || [];

    // Criar workbook
    const wb = XLSX.utils.book_new();

    // 1. Aba Resumo Executivo (Visão Geral)
    if (dashboardData) {
      const resumoData = [
        {
          "Categoria": "RESUMO EXECUTIVO",
          "Item": "",
          "Valor": "",
          "Observação": ""
        },
        {
          "Categoria": "Data de Geração",
          "Item": "Data/Hora",
          "Valor": new Date().toLocaleString('pt-BR'),
          "Observação": "Relatório gerado automaticamente"
        },
        {
          "Categoria": "",
          "Item": "",
          "Valor": "",
          "Observação": ""
        },
        {
          "Categoria": "KPIs PRINCIPAIS",
          "Item": "",
          "Valor": "",
          "Observação": ""
        },
        {
          "Categoria": "Área Total",
          "Item": "Hectares",
          "Valor": dashboardData.overviewKpis?.sicarData?.totalArea ? `${dashboardData.overviewKpis.sicarData.totalArea.toLocaleString('pt-BR')} ha` : "N/A",
          "Observação": "Total de área de todas as propriedades"
        },
        {
          "Categoria": "Receita Total",
          "Item": "Valor Anual",
          "Valor": dashboardData.overviewKpis?.financialData?.receitaTotal ? formatCurrency(dashboardData.overviewKpis.financialData.receitaTotal) : "N/A",
          "Observação": dashboardData.overviewKpis?.financialData?.receitaVariacao ? `Variação: ${dashboardData.overviewKpis.financialData.receitaVariacao > 0 ? '+' : ''}${dashboardData.overviewKpis.financialData.receitaVariacao.toFixed(1)}%` : ""
        },
        {
          "Categoria": "EBITDA",
          "Item": "Valor",
          "Valor": dashboardData.overviewKpis?.financialData?.ebitda ? formatCurrency(dashboardData.overviewKpis.financialData.ebitda) : "N/A",
          "Observação": dashboardData.overviewKpis?.financialData?.ebitdaMargem ? `Margem: ${dashboardData.overviewKpis.financialData.ebitdaMargem.toFixed(1)}%` : ""
        },
        {
          "Categoria": "Lucro Líquido",
          "Item": "Valor",
          "Valor": dashboardData.overviewKpis?.financialData?.lucroLiquido ? formatCurrency(dashboardData.overviewKpis.financialData.lucroLiquido) : "N/A",
          "Observação": "Resultado final do exercício"
        },
        {
          "Categoria": "Dívida Total",
          "Item": "Valor Total",
          "Valor": dashboardData.overviewKpis?.extendedFinancialData?.dividaTotal ? formatCurrency(dashboardData.overviewKpis.extendedFinancialData.dividaTotal) : "N/A",
          "Observação": "Dívida total consolidada"
        },
        {
          "Categoria": "Dívida Líquida",
          "Item": "Valor Total",
          "Valor": dashboardData.overviewKpis?.extendedFinancialData?.dividaTotal ? formatCurrency(dashboardData.overviewKpis.extendedFinancialData.dividaTotal) : "N/A",
          "Observação": "Dívida total menos caixa e equivalentes"
        },
        {
          "Categoria": "Produtividade Média",
          "Item": "sc/ha",
          "Valor": dashboardData.overviewKpis?.productionData?.produtividade ? `${dashboardData.overviewKpis.productionData.produtividade.toFixed(1)} sc/ha` : "N/A",
          "Observação": "Produtividade média das culturas"
        },
        {
          "Categoria": "Conformidade Ambiental",
          "Item": "Percentual",
          "Valor": dashboardData.overviewKpis?.sicarData?.percentualAreaProtegida ? `${dashboardData.overviewKpis.sicarData.percentualAreaProtegida.toFixed(1)}%` : "N/A",
          "Observação": "Reserva Legal + APP"
        },
        {
          "Categoria": "",
          "Item": "",
          "Valor": "",
          "Observação": ""
        },
        {
          "Categoria": "INDICADORES FINANCEIROS",
          "Item": "",
          "Valor": "",
          "Observação": ""
        },
        {
          "Categoria": "Dívida/EBITDA",
          "Item": "Índice",
          "Valor": dashboardData.overviewKpis?.extendedFinancialData?.dividaEbitda ? `${dashboardData.overviewKpis.extendedFinancialData.dividaEbitda.toFixed(2)}x` : "N/A",
          "Observação": "Indicador de alavancagem"
        },
        {
          "Categoria": "Dívida/Receita",
          "Item": "Percentual",
          "Valor": dashboardData.overviewKpis?.extendedFinancialData?.dividaReceita ? `${dashboardData.overviewKpis.extendedFinancialData.dividaReceita.toFixed(1)}%` : "N/A",
          "Observação": "Comprometimento da receita"
        },
        {
          "Categoria": "Liquidez Corrente",
          "Item": "Índice",
          "Valor": "N/A",
          "Observação": "Ativo Circulante / Passivo Circulante"
        },
        {
          "Categoria": "Margem EBITDA",
          "Item": "Percentual",
          "Valor": dashboardData.overviewKpis?.financialData?.ebitdaMargem ? `${dashboardData.overviewKpis.financialData.ebitdaMargem.toFixed(1)}%` : "N/A",
          "Observação": "EBITDA / Receita Total"
        },
      ];

      // Adicionar dados de distribuição bancária se disponível
      if (dashboardData.bankDistribution && dashboardData.bankDistribution.data && dashboardData.bankDistribution.data.length > 0) {
        resumoData.push(
          {
            "Categoria": "",
            "Item": "",
            "Valor": "",
            "Observação": ""
          },
          {
            "Categoria": "DISTRIBUIÇÃO BANCÁRIA",
            "Item": "",
            "Valor": "",
            "Observação": ""
          }
        );
        
        dashboardData.bankDistribution.data.forEach((bank: any) => {
          resumoData.push({
            "Categoria": bank.banco || "Banco",
            "Item": "Valor da Dívida",
            "Valor": formatCurrency(bank.valor || 0),
            "Observação": bank.percentual ? `${bank.percentual.toFixed(1)}% do total` : ""
          });
        });
      }

      const wsResumo = XLSX.utils.json_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Executivo");
    }

    // 2. Aba Propriedades
    const propertiesData = properties.map(p => ({
      "Nome": p.nome || "N/A",
      "Tipo": p.tipo === "PROPRIO" ? "Próprio" : p.tipo === "ARRENDADO" ? "Arrendado" : p.tipo || "N/A",
      "Cidade": p.cidade || "N/A",
      "Estado": p.estado || "N/A",
      "Área Total (ha)": p.area_total || 0,
      "Área Cultivada (ha)": p.area_cultivada || 0,
      "Valor Atual": formatCurrency(p.valor_atual || 0),
      "Valor Terra Nua/ha": formatCurrency(p.valor_terra_nua || 0),
      "Matrícula": p.numero_matricula || "N/A",
      "CAR": p.numero_car || "N/A",
      "Proprietário": p.proprietario || "N/A",
      "Ano Aquisição": p.ano_aquisicao || "N/A",
    }));
    const wsProperties = XLSX.utils.json_to_sheet(propertiesData);
    XLSX.utils.book_append_sheet(wb, wsProperties, "Propriedades");

    // 3. Aba Arrendamentos
    if (arrendamentos && arrendamentos.length > 0) {
      const arrendamentosData = arrendamentos.map(a => ({
        "Nome": a.nome || "N/A",
        "Propriedade": a.propriedades?.nome || "N/A",
        "Tipo": a.tipo === "ENTRADA" ? "Arrendamento Recebido" : "Arrendamento Pago",
        "Área (ha)": a.area || 0,
        "Valor Total": formatCurrency(a.valor_total || 0),
        "Valor por Hectare": formatCurrency(a.valor_hectare || 0),
        "Data Início": a.data_inicio ? new Date(a.data_inicio).toLocaleDateString("pt-BR") : "N/A",
        "Data Fim": a.data_fim ? new Date(a.data_fim).toLocaleDateString("pt-BR") : "N/A",
        "Forma Pagamento": a.forma_pagamento || "N/A",
        "Vencimento": a.vencimento || "N/A",
        "Arrendador": a.arrendador || "N/A",
        "CPF/CNPJ": a.cpf_cnpj || "N/A",
      }));
      const wsArrendamentos = XLSX.utils.json_to_sheet(arrendamentosData);
      XLSX.utils.book_append_sheet(wb, wsArrendamentos, "Arrendamentos");
    }

    // 4. Aba Áreas de Plantio (com totais por safra)
    if (plantingAreas && plantingAreas.length > 0) {
      const plantingData: any[] = [];
      const safraTotals: { [safra: string]: number } = {};
      
      plantingAreas.forEach(area => {
        if (area.areas_por_safra && Object.keys(area.areas_por_safra).length > 0) {
          Object.entries(area.areas_por_safra).forEach(([safraId, areaValue]) => {
            let safraName = "N/A";
            if (plantingAreasData?.safras) {
              const safra = plantingAreasData.safras.find(s => s.id === safraId);
              safraName = safra?.nome || "N/A";
            }
            
            // Acumular totais por safra
            if (!safraTotals[safraName]) {
              safraTotals[safraName] = 0;
            }
            safraTotals[safraName] += (areaValue as number) || 0;
            
            plantingData.push({
              "Propriedade": area.propriedades?.nome || "Todas",
              "Cultura": area.culturas?.nome || "N/A",
              "Sistema": area.sistemas?.nome || "N/A",
              "Ciclo": area.ciclos?.nome || "N/A",
              "Safra": safraName,
              "Área (ha)": areaValue || 0,
            });
          });
        }
      });
      
      // Adicionar linha de totais
      plantingData.push({
        "Propriedade": "",
        "Cultura": "",
        "Sistema": "",
        "Ciclo": "",
        "Safra": "",
        "Área (ha)": "",
      });
      
      plantingData.push({
        "Propriedade": "TOTAIS POR SAFRA",
        "Cultura": "",
        "Sistema": "",
        "Ciclo": "",
        "Safra": "",
        "Área (ha)": "",
      });
      
      Object.entries(safraTotals).forEach(([safra, total]) => {
        plantingData.push({
          "Propriedade": "",
          "Cultura": "",
          "Sistema": "",
          "Ciclo": "",
          "Safra": safra,
          "Área (ha)": total,
        });
      });
      
      const wsPlanting = XLSX.utils.json_to_sheet(plantingData);
      XLSX.utils.book_append_sheet(wb, wsPlanting, "Áreas de Plantio");
    }

    // 5. Aba Produtividades
    if (productivities && productivities.length > 0) {
      const productivityData: any[] = [];
      
      productivities.forEach(p => {
        if (p.produtividades_por_safra && typeof p.produtividades_por_safra === 'object') {
          Object.entries(p.produtividades_por_safra).forEach(([safraId, data]: [string, any]) => {
            let safraName = safraId;
            if (productivitiesData?.safras) {
              const safra = productivitiesData.safras.find(s => s.id === safraId);
              safraName = safra?.nome || safraId;
            }
            
            productivityData.push({
              "Cultura": p.culturas?.nome || "N/A",
              "Sistema": p.sistemas?.nome || "N/A",
              "Propriedade": p.propriedades?.nome || "Todas",
              "Safra": safraName,
              "Produtividade": data?.produtividade || data || 0,
              "Unidade": data?.unidade || p.unidade || "sc/ha",
            });
          });
        }
      });
      
      const wsProductivity = XLSX.utils.json_to_sheet(productivityData);
      XLSX.utils.book_append_sheet(wb, wsProductivity, "Produtividades");
    }

    // 6. Aba Custos de Produção
    if (productionCosts && productionCosts.length > 0) {
      const costsData: any[] = [];
      
      productionCosts.forEach(c => {
        if (c.custos_por_safra && typeof c.custos_por_safra === 'object') {
          Object.entries(c.custos_por_safra).forEach(([safraId, valor]: [string, any]) => {
            let safraName = safraId;
            if (productionCostsData?.safras) {
              const safra = productionCostsData.safras.find(s => s.id === safraId);
              safraName = safra?.nome || safraId;
            }
            
            costsData.push({
              "Cultura": c.culturas?.nome || "N/A",
              "Sistema": c.sistemas?.nome || "N/A",
              "Propriedade": c.propriedades?.nome || "Todas",
              "Safra": safraName,
              "Categoria": c.categoria || "N/A",
              "Valor": formatCurrency(Number(valor) || 0),
            });
          });
        }
      });
      
      const wsCosts = XLSX.utils.json_to_sheet(costsData);
      XLSX.utils.book_append_sheet(wb, wsCosts, "Custos de Produção");
    }

    // 7. Aba Preços
    if (precos && precos.length > 0) {
      const precosData = precos.map(p => ({
        "Cultura": p.culturas?.nome || "N/A",
        "Safra": p.safras?.nome || "N/A",
        "Tipo": p.tipo === "VENDA" ? "Venda" : p.tipo === "COMPRA" ? "Compra" : p.tipo || "N/A",
        "Moeda": p.moeda || "BRL",
        "Valor": formatCurrency(p.valor || 0),
        "Unidade": p.unidade || "sc",
        "Data": p.data_preco ? new Date(p.data_preco).toLocaleDateString("pt-BR") : "N/A",
        "Observações": p.observacoes || "",
      }));
      const wsPrecos = XLSX.utils.json_to_sheet(precosData);
      XLSX.utils.book_append_sheet(wb, wsPrecos, "Preços");
    }

    // 8. Aba Cotações de Câmbio
    if (cotacoesCambio && cotacoesCambio.length > 0) {
      const cotacoesData = cotacoesCambio.map(c => ({
        "Moeda": c.moeda || "N/A",
        "Valor": c.valor ? `R$ ${c.valor.toFixed(4)}` : "N/A",
        "Data": c.data_cotacao ? new Date(c.data_cotacao).toLocaleDateString("pt-BR") : "N/A",
        "Fonte": c.fonte || "Manual",
      }));
      const wsCotacoes = XLSX.utils.json_to_sheet(cotacoesData);
      XLSX.utils.book_append_sheet(wb, wsCotacoes, "Cotações de Câmbio");
    }

    // 9. Aba Máquinas e Equipamentos
    if (maquinasEquipamentos && maquinasEquipamentos.length > 0) {
      const maquinasData = maquinasEquipamentos.map(m => ({
        "Equipamento": m.equipamento || "N/A",
        "Marca": m.marca || "N/A",
        "Modelo": m.modelo || "N/A",
        "Ano Fabricação": m.ano_fabricacao || "N/A",
        "Quantidade": m.quantidade || 1,
        "Valor Unitário": formatCurrency(m.valor_unitario || 0),
        "Valor Total": formatCurrency(m.valor_total || 0),
        "Valor Reposição SR": formatCurrency(m.reposicao_sr || 0),
        "Número Série": m.numero_serie || "N/A",
        "Número Chassi": m.numero_chassi || "N/A",
        "Alienado": m.alienado ? "Sim" : "Não",
      }));
      const wsMaquinas = XLSX.utils.json_to_sheet(maquinasData);
      XLSX.utils.book_append_sheet(wb, wsMaquinas, "Máquinas e Equipamentos");
    }

    // 10. Aba Benfeitorias
    if (benfeitorias && benfeitorias.length > 0) {
      const benfeitoriasData = benfeitorias.map(b => ({
        "Nome": b.nome || "N/A",
        "Tipo": b.tipo || "N/A",
        "Propriedade": b.propriedade_nome || "N/A",
        "Ano Construção": b.ano_construcao || "N/A",
        "Área (m²)": b.area_m2 || 0,
        "Valor Atual": formatCurrency(b.valor_atual || 0),
        "Valor Novo": formatCurrency(b.valor_novo || 0),
        "Estado Conservação": b.estado_conservacao || "N/A",
        "Descrição": b.descricao || "",
      }));
      const wsBenfeitorias = XLSX.utils.json_to_sheet(benfeitoriasData);
      XLSX.utils.book_append_sheet(wb, wsBenfeitorias, "Benfeitorias");
    }

    // 11. Aba Investimentos
    if (investimentos && investimentos.length > 0) {
      const investimentosData = investimentos.map(i => ({
        "Descrição": i.descricao || "N/A",
        "Tipo": i.tipo || "N/A",
        "Valor Total": formatCurrency(i.valor_total || 0),
        "Data Investimento": i.data_investimento ? new Date(i.data_investimento).toLocaleDateString("pt-BR") : "N/A",
        "Prazo": i.prazo_meses ? `${i.prazo_meses} meses` : "N/A",
        "Taxa Retorno": i.taxa_retorno ? `${i.taxa_retorno}% a.a.` : "N/A",
        "Instituição": i.instituicao || "N/A",
        "Status": i.status || "N/A",
      }));
      const wsInvestimentos = XLSX.utils.json_to_sheet(investimentosData);
      XLSX.utils.book_append_sheet(wb, wsInvestimentos, "Investimentos");
    }

    // 12. Aba Rebanhos
    if (rebanhos && rebanhos.length > 0) {
      const rebanhosData = rebanhos.map(r => ({
        "Categoria": r.categoria || "N/A",
        "Tipo": r.tipo || "N/A",
        "Quantidade": r.quantidade || 0,
        "Valor Unitário": formatCurrency(r.valor_unitario || 0),
        "Valor Total": formatCurrency(r.valor_total || 0),
        "Propriedade": r.propriedade_nome || "Todas",
        "Observações": (r as any).observacoes || "",
      }));
      const wsRebanhos = XLSX.utils.json_to_sheet(rebanhosData);
      XLSX.utils.book_append_sheet(wb, wsRebanhos, "Rebanhos");
    }

    // 13. Aba Associações
    if (associacoes && associacoes.length > 0) {
      const associacoesData = associacoes.map(a => ({
        "Nome": a.nome || "N/A",
        "Tipo": a.tipo || "N/A",
        "CNPJ": a.cnpj || "N/A",
        "Data Associação": a.data_associacao ? new Date(a.data_associacao).toLocaleDateString("pt-BR") : "N/A",
        "Valor Cota": formatCurrency(a.valor_cota || 0),
        "Mensalidade": formatCurrency(a.mensalidade || 0),
        "Benefícios": a.beneficios || "",
        "Contato": a.contato || "",
        "Telefone": a.telefone || "",
        "Email": a.email || "",
      }));
      const wsAssociacoes = XLSX.utils.json_to_sheet(associacoesData);
      XLSX.utils.book_append_sheet(wb, wsAssociacoes, "Associações");
    }

    // 14. Aba Aquisição de Terras
    if (aquisicaoTerras && aquisicaoTerras.length > 0) {
      const aquisicaoData = aquisicaoTerras.map(a => ({
        "Propriedade": a.propriedades?.nome || "N/A",
        "Área (ha)": a.area_hectares || 0,
        "Valor Total": formatCurrency(a.valor_total || 0),
        "Valor por Hectare": formatCurrency(a.valor_hectare || 0),
        "Data Aquisição": a.data_aquisicao ? new Date(a.data_aquisicao).toLocaleDateString("pt-BR") : "N/A",
        "Vendedor": a.vendedor || "N/A",
        "Forma Pagamento": a.forma_pagamento || "N/A",
        "Parcelas": a.numero_parcelas || 0,
        "Cartório": a.cartorio || "N/A",
        "Matrícula": a.matricula || "N/A",
      }));
      const wsAquisicao = XLSX.utils.json_to_sheet(aquisicaoData);
      XLSX.utils.book_append_sheet(wb, wsAquisicao, "Aquisição de Terras");
    }

    // 15. Aba Adiantamentos
    if (adiantamentos && adiantamentos.length > 0) {
      const adiantamentosData = adiantamentos.map(a => ({
        "Descrição": a.descricao || "N/A",
        "Tipo": a.tipo === "RECEBIDO" ? "Recebido" : "Concedido",
        "Fornecedor/Cliente": a.fornecedor_cliente || "N/A",
        "Safra": a.safras?.nome || "N/A",
        "Valor": formatCurrency(a.valor || 0),
        "Data": a.data_adiantamento ? new Date(a.data_adiantamento).toLocaleDateString("pt-BR") : "N/A",
        "Vencimento": a.data_vencimento ? new Date(a.data_vencimento).toLocaleDateString("pt-BR") : "N/A",
        "Status": a.status || "N/A",
        "Observações": a.observacoes || "",
      }));
      const wsAdiantamentos = XLSX.utils.json_to_sheet(adiantamentosData);
      XLSX.utils.book_append_sheet(wb, wsAdiantamentos, "Adiantamentos");
    }

    // 16. Aba Dívidas Bancárias
    const bankDebtsData = bankDebts.map(d => {
      const valores = d.valores_por_ano || {};
      return {
        "Nome": d.nome || "N/A",
        "Modalidade": d.modalidade === "CUSTEIO" ? "Custeio" : d.modalidade === "INVESTIMENTOS" ? "Investimentos" : d.modalidade || "N/A",
        "Instituição": d.instituicao_bancaria || "N/A",
        "Ano Contratação": d.ano_contratacao || "N/A",
        "Prazo (anos)": d.prazo_anos || "N/A",
        "Carência (meses)": d.carencia_meses || 0,
        "Indexador": d.indexador || "N/A",
        "Taxa Real": d.taxa_real ? `${d.taxa_real}%` : "N/A",
        "Moeda": d.moeda || "BRL",
        "Valor Total": formatCurrency(d.valor_total || 0),
        ...Object.entries(valores).reduce((acc, [year, value]) => ({
          ...acc,
          [`Ano ${year}`]: formatCurrency(Number(value) || 0)
        }), {})
      };
    });
    const wsBankDebts = XLSX.utils.json_to_sheet(bankDebtsData);
    XLSX.utils.book_append_sheet(wb, wsBankDebts, "Dívidas Bancárias");

    // 17. Aba Dívidas de Terras
    const landDebtsData = landDebts.map(d => {
      const valores = d.valores_por_safra || d.valores_por_ano || {};
      return {
        "Nome": d.nome || d.credor || "N/A",
        "Propriedade": d.propriedade_nome || d.propriedades?.nome || "N/A",
        "Credor": d.credor || "N/A",
        "Data Aquisição": d.data_aquisicao ? new Date(d.data_aquisicao).toLocaleDateString("pt-BR") : "N/A",
        "Data Vencimento": d.data_vencimento ? new Date(d.data_vencimento).toLocaleDateString("pt-BR") : "N/A",
        "Moeda": d.moeda || "BRL",
        "Valor Total": formatCurrency(d.valor_total || 0),
        "Valor Entrada": formatCurrency(d.valor_entrada || 0),
        "Número Parcelas": d.numero_parcelas || 0,
        "Taxa Juros": d.taxa_juros ? `${d.taxa_juros}% a.a.` : "N/A",
        ...Object.entries(valores).reduce((acc, [safra, value]) => ({
          ...acc,
          [safra]: formatCurrency(Number(value) || 0)
        }), {})
      };
    });
    const wsLandDebts = XLSX.utils.json_to_sheet(landDebtsData);
    XLSX.utils.book_append_sheet(wb, wsLandDebts, "Dívidas de Terras");

    // 18. Aba Dívidas Fornecedores
    const supplierDebtsData = supplierDebts.map(d => {
      const valores = d.valores_por_safra || {};
      return {
        "Nome": d.nome || "N/A",
        "Categoria": d.categoria || "N/A",
        "Fornecedor": d.fornecedor || "N/A",
        "Moeda": d.moeda || "BRL",
        "Prazo Pagamento": d.prazo_pagamento || "N/A",
        ...Object.entries(valores).reduce((acc, [safraId, value]) => {
          let safraName = safraId;
          if (plantingAreasData?.safras) {
            const safra = plantingAreasData.safras.find(s => s.id === safraId);
            safraName = safra?.nome || safraId;
          }
          return {
            ...acc,
            [safraName]: formatCurrency(Number(value) || 0)
          };
        }, {})
      };
    });
    const wsSupplierDebts = XLSX.utils.json_to_sheet(supplierDebtsData);
    XLSX.utils.book_append_sheet(wb, wsSupplierDebts, "Dívidas Fornecedores");

    // 19. Aba Caixa e Disponibilidades
    const cashData = cashAvailability.map(c => {
      const valores = c.valores_por_safra || c.valores_por_ano || {};
      const categoriaMap = {
        "CAIXA_BANCOS": "Caixa e Bancos",
        "CLIENTES": "Clientes",
        "ADIANTAMENTOS": "Adiantamentos a Fornecedores",
        "EMPRESTIMOS": "Empréstimos a Terceiros",
        "ESTOQUE_DEFENSIVOS": "Estoque de Defensivos",
        "ESTOQUE_FERTILIZANTES": "Estoque de Fertilizantes",
        "ESTOQUE_ALMOXARIFADO": "Estoque Almoxarifado",
        "ESTOQUE_COMMODITIES": "Estoque de Commodities",
        "SEMOVENTES": "Semoventes/Rebanho",
        "ATIVO_BIOLOGICO": "Ativo Biológico"
      };
      
      return {
        "Nome": c.nome || "N/A",
        "Categoria": categoriaMap[c.categoria as keyof typeof categoriaMap] || c.categoria || "N/A",
        "Descrição": c.descricao || "",
        ...Object.entries(valores).reduce((acc, [key, value]) => {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
          
          if (isUUID && plantingAreasData?.safras) {
            const safra = plantingAreasData.safras.find(s => s.id === key);
            const columnName = safra?.nome || "N/A";
            return {
              ...acc,
              [columnName]: formatCurrency(Number(value) || 0)
            };
          } else {
            return {
              ...acc,
              [`Ano ${key}`]: formatCurrency(Number(value) || 0)
            };
          }
        }, {})
      };
    });
    const wsCash = XLSX.utils.json_to_sheet(cashData);
    XLSX.utils.book_append_sheet(wb, wsCash, "Caixa e Disponibilidades");

    // 20. Aba Operações Financeiras
    const financialOpsData = financialOperations.map(f => {
      const valores = f.valores_por_safra || f.valores_por_ano || {};
      const categoriaMap = {
        "JUROS_PAGOS": "Juros Pagos",
        "JUROS_RECEBIDOS": "Juros Recebidos",
        "TAXAS_BANCARIAS": "Taxas Bancárias",
        "IOF": "IOF",
        "OUTRAS_DESPESAS": "Outras Despesas Financeiras",
        "OUTRAS_RECEITAS": "Outras Receitas Financeiras",
        "NOVAS_LINHAS_CREDITO": "Novas Linhas Crédito-Bancos/Adto. Clientes"
      };
      
      return {
        "Nome": f.nome || "N/A",
        "Categoria": categoriaMap[f.categoria as keyof typeof categoriaMap] || f.categoria || "N/A",
        "Descrição": f.descricao || "",
        ...Object.entries(valores).reduce((acc, [key, value]) => {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
          
          if (isUUID && plantingAreasData?.safras) {
            const safra = plantingAreasData.safras.find(s => s.id === key);
            const columnName = safra?.nome || "N/A";
            return {
              ...acc,
              [columnName]: formatCurrency(Number(value) || 0)
            };
          } else {
            return {
              ...acc,
              [`Ano ${key}`]: formatCurrency(Number(value) || 0)
            };
          }
        }, {})
      };
    });
    const wsFinancialOps = XLSX.utils.json_to_sheet(financialOpsData);
    XLSX.utils.book_append_sheet(wb, wsFinancialOps, "Operações Financeiras");

    // 21. Aba Outras Despesas
    const otherExpensesData = otherExpenses.map(e => {
      const valores = e.valores_por_safra || e.valores_por_ano || {};
      const categoriaMap = {
        "TRIBUTARIAS": "Despesas Tributárias",
        "PRO_LABORE": "Pró-Labore dos Sócios",
        "OUTRAS_OPERACIONAIS": "Outras Despesas Operacionais",
        "DESPESAS_ADMINISTRATIVAS": "Despesas Administrativas",
        "DESPESAS_COMERCIAIS": "Despesas Comerciais",
        "DESPESAS_FINANCEIRAS": "Despesas Financeiras",
        "MANUTENCAO": "Manutenção",
        "SEGUROS": "Seguros",
        "CONSULTORIAS": "Consultorias",
        "DEPRECIACAO": "Depreciação",
        "AMORTIZACAO": "Amortização",
        "ARRENDAMENTOS": "Arrendamentos",
        "PESSOAL": "Pessoal",
        "ENERGIA_COMBUSTIVEL": "Energia e Combustível",
        "COMUNICACAO": "Comunicação",
        "VIAGENS": "Viagens",
        "MATERIAL_ESCRITORIO": "Material de Escritório",
        "OUTROS": "Outras Despesas Operacionais"
      };
      
      return {
        "Nome": e.descricao || categoriaMap[e.categoria as keyof typeof categoriaMap] || e.categoria || "N/A",
        "Categoria": categoriaMap[e.categoria as keyof typeof categoriaMap] || e.categoria || "N/A",
        ...Object.entries(valores).reduce((acc, [key, value]) => {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
          
          if (isUUID && plantingAreasData?.safras) {
            const safra = plantingAreasData.safras.find(s => s.id === key);
            const columnName = safra?.nome || "N/A";
            return {
              ...acc,
              [columnName]: formatCurrency(Number(value) || 0)
            };
          } else {
            return {
              ...acc,
              [`Ano ${key}`]: formatCurrency(Number(value) || 0)
            };
          }
        }, {})
      };
    });
    const wsOtherExpenses = XLSX.utils.json_to_sheet(otherExpensesData);
    XLSX.utils.book_append_sheet(wb, wsOtherExpenses, "Outras Despesas");

    // 22. Aba Receitas Financeiras
    const revenuesData = financialRevenues.map(r => {
      const categoriaMap = {
        "VENDA_PRODUCAO": "Venda de Produção",
        "SERVICOS": "Serviços",
        "ARRENDAMENTO": "Arrendamento",
        "JUROS": "Juros",
        "DIVIDENDOS": "Dividendos",
        "OUTRAS": "Outras Receitas"
      };
      
      return {
        "Descrição": r.descricao || "N/A",
        "Categoria": categoriaMap[r.categoria as keyof typeof categoriaMap] || r.categoria || "N/A",
        "Moeda": r.moeda || "BRL",
        "Valor": formatCurrency(r.valor || 0),
        "Safra": (r as any).safra?.nome || (r as any).safras?.nome || "N/A",
        "Data": (r as any).data ? new Date((r as any).data).toLocaleDateString("pt-BR") : "N/A",
        "Observações": (r as any).observacoes || "",
      };
    });
    const wsRevenues = XLSX.utils.json_to_sheet(revenuesData);
    XLSX.utils.book_append_sheet(wb, wsRevenues, "Receitas Financeiras");

    // 23. Aba Fluxo de Caixa
    if (cashFlowData && (cashFlowData as any).length > 0) {
      const cashFlowFormatted = (cashFlowData as any).map((row: any) => {
        const formattedRow: any = {
          "Categoria": row.categoria || "N/A",
          "Item": row.item || "N/A",
        };
        
        Object.keys(row).forEach(key => {
          if (key.startsWith('ano_')) {
            const year = key.replace('ano_', '');
            formattedRow[`Ano ${year}`] = formatCurrency(row[key] || 0);
          }
        });
        
        return formattedRow;
      });
      
      const wsCashFlow = XLSX.utils.json_to_sheet(cashFlowFormatted);
      XLSX.utils.book_append_sheet(wb, wsCashFlow, "Fluxo de Caixa");
    }

    // 24. Aba DRE (Demonstração de Resultados)
    if (dreData && (dreData as any).length > 0) {
      const dreFormatted = (dreData as any).map((row: any) => {
        const formattedRow: any = {
          "Categoria": row.categoria || "N/A",
          "Item": row.item || "N/A",
        };
        
        Object.keys(row).forEach(key => {
          if (key.startsWith('ano_')) {
            const year = key.replace('ano_', '');
            formattedRow[`Ano ${year}`] = formatCurrency(row[key] || 0);
          }
        });
        
        return formattedRow;
      });
      
      const wsDRE = XLSX.utils.json_to_sheet(dreFormatted);
      XLSX.utils.book_append_sheet(wb, wsDRE, "DRE");
    }

    // 25. Aba Balanço Patrimonial
    if (balanceSheetData && (balanceSheetData as any).length > 0) {
      const balanceFormatted = (balanceSheetData as any).map((row: any) => {
        const formattedRow: any = {
          "Categoria": row.categoria || "N/A",
          "Conta": row.conta || "N/A",
        };
        
        Object.keys(row).forEach(key => {
          if (key.startsWith('ano_')) {
            const year = key.replace('ano_', '');
            formattedRow[`Ano ${year}`] = formatCurrency(row[key] || 0);
          }
        });
        
        return formattedRow;
      });
      
      const wsBalance = XLSX.utils.json_to_sheet(balanceFormatted);
      XLSX.utils.book_append_sheet(wb, wsBalance, "Balanço Patrimonial");
    }

    // 26. Aba Análise de Sensibilidade (se houver dados de cenários)
    const analysisData = [
      {
        "Análise": "ANÁLISE DE SENSIBILIDADE",
        "Descrição": "",
        "Cenário Base": "",
        "Cenário Otimista": "",
        "Cenário Pessimista": ""
      },
      {
        "Análise": "Variação de Preços",
        "Descrição": "Impacto da variação de preços das commodities",
        "Cenário Base": "0%",
        "Cenário Otimista": "+10%",
        "Cenário Pessimista": "-10%"
      },
      {
        "Análise": "Variação de Produtividade",
        "Descrição": "Impacto da variação de produtividade",
        "Cenário Base": "0%",
        "Cenário Otimista": "+15%",
        "Cenário Pessimista": "-15%"
      },
      {
        "Análise": "Variação de Custos",
        "Descrição": "Impacto da variação dos custos de produção",
        "Cenário Base": "0%",
        "Cenário Otimista": "-5%",
        "Cenário Pessimista": "+20%"
      },
      {
        "Análise": "Variação Cambial",
        "Descrição": "Impacto da variação cambial (USD)",
        "Cenário Base": "R$ 5,00",
        "Cenário Otimista": "R$ 5,50",
        "Cenário Pessimista": "R$ 4,50"
      }
    ];
    const wsAnalysis = XLSX.utils.json_to_sheet(analysisData);
    XLSX.utils.book_append_sheet(wb, wsAnalysis, "Análise de Sensibilidade");

    // 27. Aba Indicadores Consolidados
    if (dashboardData && dashboardData.financialMetrics) {
      const indicatorsData = [
        {
          "Categoria": "LIQUIDEZ",
          "Indicador": "",
          "Valor": "",
          "Status": "",
          "Observação": ""
        }
      ];

      const metrics = dashboardData.financialMetrics as any;
      
      // Indicadores de Liquidez
      if (metrics.liquidezCorrente) {
        indicatorsData.push({
          "Categoria": "Liquidez",
          "Indicador": "Liquidez Corrente",
          "Valor": metrics.liquidezCorrente.toFixed(2),
          "Status": metrics.liquidezCorrente >= 1.5 ? "Bom" : metrics.liquidezCorrente >= 1.0 ? "Regular" : "Crítico",
          "Observação": "Ativo Circulante / Passivo Circulante"
        });
      }

      if (metrics.liquidezSeca) {
        indicatorsData.push({
          "Categoria": "Liquidez",
          "Indicador": "Liquidez Seca",
          "Valor": metrics.liquidezSeca.toFixed(2),
          "Status": metrics.liquidezSeca >= 1.0 ? "Bom" : metrics.liquidezSeca >= 0.7 ? "Regular" : "Crítico",
          "Observação": "(Ativo Circulante - Estoques) / Passivo Circulante"
        });
      }

      if (metrics.liquidezGeral) {
        indicatorsData.push({
          "Categoria": "Liquidez",
          "Indicador": "Liquidez Geral",
          "Valor": metrics.liquidezGeral.toFixed(2),
          "Status": metrics.liquidezGeral >= 1.2 ? "Bom" : metrics.liquidezGeral >= 0.8 ? "Regular" : "Crítico",
          "Observação": "(Ativo Circulante + Realizável LP) / (Passivo Circulante + Exigível LP)"
        });
      }

      // Adicionar seção de rentabilidade
      indicatorsData.push(
        {
          "Categoria": "",
          "Indicador": "",
          "Valor": "",
          "Status": "",
          "Observação": ""
        },
        {
          "Categoria": "RENTABILIDADE",
          "Indicador": "",
          "Valor": "",
          "Status": "",
          "Observação": ""
        }
      );

      if (metrics.margemLiquida) {
        indicatorsData.push({
          "Categoria": "Rentabilidade",
          "Indicador": "Margem Líquida",
          "Valor": `${metrics.margemLiquida.toFixed(1)}%`,
          "Status": metrics.margemLiquida >= 15 ? "Excelente" : metrics.margemLiquida >= 10 ? "Bom" : metrics.margemLiquida >= 5 ? "Regular" : "Baixo",
          "Observação": "Lucro Líquido / Receita Total"
        });
      }

      if (metrics.margemEbitda) {
        indicatorsData.push({
          "Categoria": "Rentabilidade",
          "Indicador": "Margem EBITDA",
          "Valor": `${metrics.margemEbitda.toFixed(1)}%`,
          "Status": metrics.margemEbitda >= 25 ? "Excelente" : metrics.margemEbitda >= 15 ? "Bom" : metrics.margemEbitda >= 10 ? "Regular" : "Baixo",
          "Observação": "EBITDA / Receita Total"
        });
      }

      if (metrics.roe) {
        indicatorsData.push({
          "Categoria": "Rentabilidade",
          "Indicador": "ROE",
          "Valor": `${metrics.roe.toFixed(1)}%`,
          "Status": metrics.roe >= 15 ? "Excelente" : metrics.roe >= 10 ? "Bom" : metrics.roe >= 5 ? "Regular" : "Baixo",
          "Observação": "Return on Equity - Retorno sobre Patrimônio"
        });
      }

      if (metrics.roa) {
        indicatorsData.push({
          "Categoria": "Rentabilidade",
          "Indicador": "ROA",
          "Valor": `${metrics.roa.toFixed(1)}%`,
          "Status": metrics.roa >= 10 ? "Excelente" : metrics.roa >= 7 ? "Bom" : metrics.roa >= 3 ? "Regular" : "Baixo",
          "Observação": "Return on Assets - Retorno sobre Ativos"
        });
      }

      // Adicionar seção de endividamento
      indicatorsData.push(
        {
          "Categoria": "",
          "Indicador": "",
          "Valor": "",
          "Status": "",
          "Observação": ""
        },
        {
          "Categoria": "ENDIVIDAMENTO",
          "Indicador": "",
          "Valor": "",
          "Status": "",
          "Observação": ""
        }
      );

      if (dashboardData.overviewKpis?.extendedFinancialData?.dividaEbitda) {
        const dividaEbitda = dashboardData.overviewKpis.extendedFinancialData.dividaEbitda;
        indicatorsData.push({
          "Categoria": "Endividamento",
          "Indicador": "Dívida/EBITDA",
          "Valor": `${dividaEbitda.toFixed(2)}x`,
          "Status": dividaEbitda <= 2 ? "Excelente" : dividaEbitda <= 3 ? "Bom" : dividaEbitda <= 4 ? "Atenção" : "Crítico",
          "Observação": "Múltiplo de dívida sobre EBITDA"
        });
      }

      if (dashboardData.overviewKpis?.extendedFinancialData?.dividaReceita) {
        const dividaReceita = dashboardData.overviewKpis.extendedFinancialData.dividaReceita;
        indicatorsData.push({
          "Categoria": "Endividamento",
          "Indicador": "Dívida/Receita",
          "Valor": `${dividaReceita.toFixed(1)}%`,
          "Status": dividaReceita <= 30 ? "Excelente" : dividaReceita <= 50 ? "Bom" : dividaReceita <= 70 ? "Atenção" : "Crítico",
          "Observação": "Percentual da receita comprometida com dívidas"
        });
      }

      if (metrics.endividamentoGeral) {
        indicatorsData.push({
          "Categoria": "Endividamento",
          "Indicador": "Endividamento Geral",
          "Valor": `${metrics.endividamentoGeral.toFixed(1)}%`,
          "Status": metrics.endividamentoGeral <= 40 ? "Excelente" : metrics.endividamentoGeral <= 60 ? "Bom" : metrics.endividamentoGeral <= 80 ? "Atenção" : "Crítico",
          "Observação": "(Passivo Circulante + Exigível LP) / Ativo Total"
        });
      }

      // Adicionar seção de eficiência
      indicatorsData.push(
        {
          "Categoria": "",
          "Indicador": "",
          "Valor": "",
          "Status": "",
          "Observação": ""
        },
        {
          "Categoria": "EFICIÊNCIA OPERACIONAL",
          "Indicador": "",
          "Valor": "",
          "Status": "",
          "Observação": ""
        }
      );

      if (metrics.giroAtivo) {
        indicatorsData.push({
          "Categoria": "Eficiência",
          "Indicador": "Giro do Ativo",
          "Valor": `${metrics.giroAtivo.toFixed(2)}x`,
          "Status": metrics.giroAtivo >= 1.5 ? "Excelente" : metrics.giroAtivo >= 1.0 ? "Bom" : metrics.giroAtivo >= 0.5 ? "Regular" : "Baixo",
          "Observação": "Receita Total / Ativo Total"
        });
      }

      const wsIndicators = XLSX.utils.json_to_sheet(indicatorsData);
      XLSX.utils.book_append_sheet(wb, wsIndicators, "Indicadores");
    }

    // Gerar arquivo Excel
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    console.error("Erro ao gerar Excel V2:", error);
    throw new Error("Falha ao gerar arquivo Excel");
  }
}