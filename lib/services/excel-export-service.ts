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

export interface ExportData {
  properties: any[];
  production: {
    plantingAreas: any[];
    productivities: any[];
    costs: any[];
  };
  financial: {
    bankDebts: any[];
    landDebts: any[];
    supplierDebts: any[];
    cashAvailability: any[];
    financialOperations: any[];
    otherExpenses: any[];
    financialRevenues: any[];
  };
  projections: {
    cashFlow: any;
    dre: any;
    balanceSheet: any;
  };
}

export async function generateExcelExport(organizationId: string): Promise<Blob> {
  try {
    // Buscar todos os dados da organização
    const [
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
    ] = await Promise.all([
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
    ]);

  // Extrair os arrays dos objetos retornados
  const plantingAreas = plantingAreasData?.plantingAreas || [];
  const productivities = productivitiesData?.productivities || [];
  const productionCosts = productionCostsData?.productionCosts || [];


  // Criar workbook
  const wb = XLSX.utils.book_new();

  // 1. Aba Propriedades
  const propertiesData = properties.map(p => ({
    "Nome": p.nome || "N/A",
    "Tipo": p.tipo === "PROPRIO" ? "Próprio" : p.tipo === "ARRENDADO" ? "Arrendado" : p.tipo || "N/A",
    "Cidade": p.cidade || "N/A",
    "Estado": p.estado || "N/A",
    "Área Total (ha)": p.area_total || 0,
    "Área Cultivada (ha)": p.area_cultivada || 0,
    "Valor Atual": formatCurrency(p.valor_atual || 0),
    "Matrícula": p.numero_matricula || "N/A",
    "Proprietário": p.proprietario || "N/A",
    "Ano Aquisição": p.ano_aquisicao || "N/A",
  }));
  const wsProperties = XLSX.utils.json_to_sheet(propertiesData);
  XLSX.utils.book_append_sheet(wb, wsProperties, "Propriedades");

  // 2. Aba Áreas de Plantio
  if (plantingAreas && plantingAreas.length > 0) {
    const plantingData: any[] = [];
    
    plantingAreas.forEach(area => {
      // Se tiver areas_por_safra, expandir em múltiplas linhas
      if (area.areas_por_safra && Object.keys(area.areas_por_safra).length > 0) {
        Object.entries(area.areas_por_safra).forEach(([safraId, areaValue]) => {
          let safraName = "N/A";
          if (plantingAreasData?.safras) {
            const safra = plantingAreasData.safras.find(s => s.id === safraId);
            safraName = safra?.nome || "N/A";
          }
          
          plantingData.push({
            "Propriedade": area.propriedades?.nome || "N/A",
            "Cultura": area.culturas?.nome || "N/A",
            "Sistema": area.sistemas?.nome || "N/A",
            "Ciclo": area.ciclos?.nome || "N/A",
            "Safra": safraName,
            "Área (ha)": areaValue || 0,
          });
        });
      } else {
        // Fallback para o formato antigo
        let safraName = "N/A";
        if (area.safra_id && plantingAreasData?.safras) {
          const safra = plantingAreasData.safras.find(s => s.id === area.safra_id);
          safraName = safra?.nome || "N/A";
        }
        
        plantingData.push({
          "Propriedade": area.propriedades?.nome || "N/A",
          "Cultura": area.culturas?.nome || "N/A",
          "Sistema": area.sistemas?.nome || "N/A",
          "Ciclo": area.ciclos?.nome || "N/A",
          "Safra": safraName,
          "Área (ha)": area.area || 0,
        });
      }
    });
    
    const wsPlanting = XLSX.utils.json_to_sheet(plantingData);
    XLSX.utils.book_append_sheet(wb, wsPlanting, "Áreas de Plantio");
  } else {
    // Criar aba vazia se não houver dados
    const wsPlanting = XLSX.utils.json_to_sheet([{ "Mensagem": "Nenhuma área de plantio cadastrada" }]);
    XLSX.utils.book_append_sheet(wb, wsPlanting, "Áreas de Plantio");
  }

  // 3. Aba Produtividades
  if (productivities && productivities.length > 0) {
    const productivityData: any[] = [];
    
    productivities.forEach(p => {
      // Se tiver produtividades por safra, expandir em múltiplas linhas
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
            "Safra": safraName,
            "Produtividade": data?.produtividade || data || 0,
            "Unidade": data?.unidade || p.unidade || "sc/ha",
          });
        });
      } else {
        // Caso não tenha produtividades por safra, usar valores gerais
        productivityData.push({
          "Cultura": p.culturas?.nome || "N/A",
          "Sistema": p.sistemas?.nome || "N/A",
          "Safra": "Geral",
          "Produtividade": p.produtividade || 0,
          "Unidade": p.unidade || "sc/ha",
        });
      }
    });
    
    const wsProductivity = XLSX.utils.json_to_sheet(productivityData);
    XLSX.utils.book_append_sheet(wb, wsProductivity, "Produtividades");
  } else {
    const wsProductivity = XLSX.utils.json_to_sheet([{ "Mensagem": "Nenhuma produtividade cadastrada" }]);
    XLSX.utils.book_append_sheet(wb, wsProductivity, "Produtividades");
  }

  // 4. Aba Custos de Produção
  if (productionCosts && productionCosts.length > 0) {
    const costsData: any[] = [];
    
    productionCosts.forEach(c => {
      // Se tiver custos por safra, expandir em múltiplas linhas
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
            "Safra": safraName,
            "Categoria": c.categoria || "N/A",
            "Valor": formatCurrency(Number(valor) || 0),
          });
        });
      } else {
        // Caso não tenha custos por safra, usar valor geral
        costsData.push({
          "Cultura": c.culturas?.nome || "N/A",
          "Sistema": c.sistemas?.nome || "N/A",
          "Safra": c.safras?.nome || "Geral",
          "Categoria": c.categoria || "N/A",
          "Valor": formatCurrency(c.valor || 0),
        });
      }
    });
    
    const wsCosts = XLSX.utils.json_to_sheet(costsData);
    XLSX.utils.book_append_sheet(wb, wsCosts, "Custos de Produção");
  } else {
    const wsCosts = XLSX.utils.json_to_sheet([{ "Mensagem": "Nenhum custo de produção cadastrado" }]);
    XLSX.utils.book_append_sheet(wb, wsCosts, "Custos de Produção");
  }

  // 5. Aba Dívidas Bancárias
  const bankDebtsData = bankDebts.map(d => {
    const valores = d.valores_por_ano || {};
    return {
      "Nome": d.nome || "N/A",
      "Modalidade": d.modalidade === "CUSTEIO" ? "Custeio" : d.modalidade === "INVESTIMENTOS" ? "Investimentos" : d.modalidade || "N/A",
      "Instituição": d.instituicao_bancaria || "N/A",
      "Ano Contratação": d.ano_contratacao || "N/A",
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

  // 6. Aba Dívidas de Terras
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
      ...Object.entries(valores).reduce((acc, [safra, value]) => ({
        ...acc,
        [safra]: formatCurrency(Number(value) || 0)
      }), {})
    };
  });
  const wsLandDebts = XLSX.utils.json_to_sheet(landDebtsData);
  XLSX.utils.book_append_sheet(wb, wsLandDebts, "Dívidas de Terras");

  // 7. Aba Dívidas Fornecedores
  const supplierDebtsData = supplierDebts.map(d => {
    const valores = d.valores_por_safra || {};
    return {
      "Nome": d.nome || "N/A",
      "Categoria": d.categoria || "N/A",
      "Moeda": d.moeda || "BRL",
      ...Object.entries(valores).reduce((acc, [safraId, value]) => {
        // Tentar encontrar o nome da safra
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

  // 8. Aba Caixa e Disponibilidades
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
      ...Object.entries(valores).reduce((acc, [key, value]) => {
        // Verificar se é um UUID (safra ID)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
        
        if (isUUID && plantingAreasData?.safras) {
          const safra = plantingAreasData.safras.find(s => s.id === key);
          const columnName = safra?.nome || "N/A";
          return {
            ...acc,
            [`Ano ${columnName}`]: formatCurrency(Number(value) || 0)
          };
        } else {
          // Se não for UUID, usar o valor como está
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

  // 9. Aba Operações Financeiras
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
      ...Object.entries(valores).reduce((acc, [key, value]) => {
        // Verificar se é um UUID (safra ID)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
        
        if (isUUID && plantingAreasData?.safras) {
          const safra = plantingAreasData.safras.find(s => s.id === key);
          const columnName = safra?.nome || "N/A";
          return {
            ...acc,
            [`Ano ${columnName}`]: formatCurrency(Number(value) || 0)
          };
        } else {
          // Se não for UUID, usar o valor como está
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

  // 10. Aba Outras Despesas
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
        // Verificar se é um UUID (safra ID)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
        
        if (isUUID && plantingAreasData?.safras) {
          const safra = plantingAreasData.safras.find(s => s.id === key);
          const columnName = safra?.nome || "N/A";
          return {
            ...acc,
            [`Ano ${columnName}`]: formatCurrency(Number(value) || 0)
          };
        } else {
          // Se não for UUID, usar o valor como está
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

  // 11. Aba Receitas Financeiras
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
    };
  });
  const wsRevenues = XLSX.utils.json_to_sheet(revenuesData);
  XLSX.utils.book_append_sheet(wb, wsRevenues, "Receitas Financeiras");

  // 12. Aba Fluxo de Caixa Completo
  if (cashFlowData && (cashFlowData as any).length > 0) {
    const cashFlowFormatted = (cashFlowData as any).map((row: any) => {
      const formattedRow: any = {
        "Categoria": row.categoria || "N/A",
        "Item": row.item || "N/A",
      };
      
      // Adicionar colunas de anos dinamicamente
      Object.keys(row).forEach(key => {
        if (key.startsWith('ano_')) {
          const year = key.replace('ano_', '');
          formattedRow[`Ano ${year}`] = formatCurrency(row[key] || 0);
        }
      });
      
      return formattedRow;
    });
    
    const wsCashFlow = XLSX.utils.json_to_sheet(cashFlowFormatted);
    XLSX.utils.book_append_sheet(wb, wsCashFlow, "Fluxo de Caixa Completo");
  }

  // 13. Aba DRE (Demonstração de Resultados)
  if (dreData && (dreData as any).length > 0) {
    const dreFormatted = (dreData as any).map((row: any) => {
      const formattedRow: any = {
        "Categoria": row.categoria || "N/A",
        "Item": row.item || "N/A",
      };
      
      // Adicionar colunas de anos dinamicamente
      Object.keys(row).forEach(key => {
        if (key.startsWith('ano_')) {
          const year = key.replace('ano_', '');
          formattedRow[`Ano ${year}`] = formatCurrency(row[key] || 0);
        }
      });
      
      return formattedRow;
    });
    
    const wsDRE = XLSX.utils.json_to_sheet(dreFormatted);
    XLSX.utils.book_append_sheet(wb, wsDRE, "DRE Completo");
  }

  // 14. Aba Balanço Patrimonial
  if (balanceSheetData && (balanceSheetData as any).length > 0) {
    const balanceFormatted = (balanceSheetData as any).map((row: any) => {
      const formattedRow: any = {
        "Categoria": row.categoria || "N/A",
        "Conta": row.conta || "N/A",
      };
      
      // Adicionar colunas de anos dinamicamente
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

    // Gerar arquivo Excel
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    console.error("Erro ao gerar Excel:", error);
    throw new Error("Falha ao gerar arquivo Excel");
  }
}