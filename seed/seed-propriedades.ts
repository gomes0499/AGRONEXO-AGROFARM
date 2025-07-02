import { createClient } from "@/lib/supabase/server";

// ID da organização de teste
const ORGANIZACAO_TESTE_ID = "yxhazxmvpazrcfwxzdaz";

interface PropriedadeData {
  nome: string;
  estado: string;
  numero_matricula: string;
  area_total: number;
  valor_hectare: number;
  valor_total: number;
}

const propriedades: PropriedadeData[] = [
  // Condomínio Alvorada
  { nome: "COND. ALVORADA", estado: "BA", numero_matricula: "18144", area_total: 46.94, valor_hectare: 100000, valor_total: 4693650 },
  { nome: "ALVORADA I", estado: "BA", numero_matricula: "14574", area_total: 251.71, valor_hectare: 100000, valor_total: 25170600 },
  { nome: "ALVORADA II", estado: "BA", numero_matricula: "14575", area_total: 250.43, valor_hectare: 100000, valor_total: 25043120 },
  { nome: "ALVORADA III", estado: "BA", numero_matricula: "15792", area_total: 430.20, valor_hectare: 100000, valor_total: 43019600 },
  { nome: "ALVORADA IV", estado: "BA", numero_matricula: "13200", area_total: 431.29, valor_hectare: 100000, valor_total: 43129010 },
  { nome: "ALVORADA V", estado: "BA", numero_matricula: "13478", area_total: 431.04, valor_hectare: 100000, valor_total: 43104250 },
  { nome: "ALVORADA VI", estado: "BA", numero_matricula: "12883", area_total: 431.04, valor_hectare: 100000, valor_total: 43104450 },
  { nome: "ALVORADA VII", estado: "BA", numero_matricula: "13203", area_total: 191.00, valor_hectare: 100000, valor_total: 19100000 },
  { nome: "ALVORADA VIII", estado: "BA", numero_matricula: "18037", area_total: 234.58, valor_hectare: 100000, valor_total: 23457710 },
  { nome: "ALVORADA IX", estado: "BA", numero_matricula: "18038", area_total: 232.63, valor_hectare: 100000, valor_total: 23262820 },
  { nome: "ALVORADA X", estado: "BA", numero_matricula: "18039", area_total: 237.06, valor_hectare: 100000, valor_total: 23706440 },
  { nome: "ALVORADA XI", estado: "BA", numero_matricula: "13107", area_total: 237.47, valor_hectare: 100000, valor_total: 23746510 },
  { nome: "ALVORADA XII", estado: "BA", numero_matricula: "13108", area_total: 322.24, valor_hectare: 100000, valor_total: 32224340 },
  { nome: "ALVORADA XIII", estado: "BA", numero_matricula: "12884", area_total: 299.95, valor_hectare: 100000, valor_total: 29995160 },
  { nome: "ALVORADA XIV", estado: "BA", numero_matricula: "12885", area_total: 295.50, valor_hectare: 100000, valor_total: 29549940 },
  { nome: "ALVORADA XV", estado: "BA", numero_matricula: "13109", area_total: 400.00, valor_hectare: 100000, valor_total: 40000000 },
  { nome: "ALVORADA XVI", estado: "BA", numero_matricula: "18041", area_total: 298.89, valor_hectare: 100000, valor_total: 29889410 },
  { nome: "ALVORADA XVII", estado: "BA", numero_matricula: "13211", area_total: 353.17, valor_hectare: 100000, valor_total: 35317240 },
  { nome: "ALVORADA XVIII", estado: "BA", numero_matricula: "13432", area_total: 382.65, valor_hectare: 100000, valor_total: 38265190 },
  { nome: "ALVORADA XIX", estado: "BA", numero_matricula: "12886", area_total: 319.36, valor_hectare: 100000, valor_total: 31936000 },
  { nome: "ALVORADA XX", estado: "BA", numero_matricula: "12887", area_total: 327.36, valor_hectare: 100000, valor_total: 32736000 },
  
  // Nova Alvorada
  { nome: "NOVA ALVORADA I", estado: "BA", numero_matricula: "3576", area_total: 791.00, valor_hectare: 6000, valor_total: 4746000 },
  { nome: "NOVA ALVORADA II", estado: "BA", numero_matricula: "3575", area_total: 651.00, valor_hectare: 6000, valor_total: 3906000 },
  { nome: "NOVA ALVORADA III", estado: "BA", numero_matricula: "1668", area_total: 995.00, valor_hectare: 6000, valor_total: 5970000 },
  { nome: "NOVA ALVORADA IV", estado: "BA", numero_matricula: "1669", area_total: 990.00, valor_hectare: 6000, valor_total: 5940000 },
  { nome: "NOVA ALVORADA V", estado: "BA", numero_matricula: "1667", area_total: 982.00, valor_hectare: 6000, valor_total: 5892000 },
  { nome: "NOVA ALVORADA VI", estado: "BA", numero_matricula: "397", area_total: 960.00, valor_hectare: 6000, valor_total: 5760000 },
  { nome: "NOVA ALVORADA VII", estado: "BA", numero_matricula: "102", area_total: 970.00, valor_hectare: 6000, valor_total: 5820000 },
  { nome: "NOVA ALVORADA VIII", estado: "BA", numero_matricula: "3577", area_total: 854.00, valor_hectare: 6000, valor_total: 5124000 },
  
  // Mafisa
  { nome: "MAFISA I", estado: "PI", numero_matricula: "2633", area_total: 925.77, valor_hectare: 65000, valor_total: 60175050 },
  { nome: "MAFISA II", estado: "PI", numero_matricula: "2631", area_total: 921.95, valor_hectare: 65000, valor_total: 59926750 },
  { nome: "MAFISA III", estado: "PI", numero_matricula: "2632", area_total: 980.08, valor_hectare: 65000, valor_total: 63705200 },
  { nome: "MAFISA IV", estado: "PI", numero_matricula: "2634", area_total: 979.04, valor_hectare: 65000, valor_total: 63637600 },
  { nome: "MAFISA V", estado: "PI", numero_matricula: "2636", area_total: 800.33, valor_hectare: 65000, valor_total: 52021450 },
  { nome: "MAFISA VI", estado: "PI", numero_matricula: "2635", area_total: 915.22, valor_hectare: 65000, valor_total: 59489300 },
  { nome: "MAFISA VII", estado: "PI", numero_matricula: "2638", area_total: 680.88, valor_hectare: 65000, valor_total: 44257200 },
  { nome: "MAFISA VIII", estado: "PI", numero_matricula: "2637", area_total: 680.88, valor_hectare: 65000, valor_total: 44257200 },
  { nome: "MAFISA 09", estado: "PI", numero_matricula: "4095", area_total: 139.00, valor_hectare: 65000, valor_total: 9035000 },
  { nome: "MAFISA 10", estado: "PI", numero_matricula: "4090", area_total: 300.00, valor_hectare: 65000, valor_total: 19500000 },
  { nome: "MAFISA 11", estado: "PI", numero_matricula: "3708", area_total: 621.70, valor_hectare: 65000, valor_total: 40410500 },
  
  // Nova Estrela
  { nome: "NOVA ESTRELA I", estado: "PI", numero_matricula: "2596", area_total: 7227.00, valor_hectare: 20000, valor_total: 144540000 },
  { nome: "NOVA ESTRELA II", estado: "PI", numero_matricula: "2597", area_total: 7206.00, valor_hectare: 20000, valor_total: 144120000 },
  { nome: "NOVA ESTRELA III", estado: "PI", numero_matricula: "2595", area_total: 1606.00, valor_hectare: 20000, valor_total: 32120000 },
  
  // Fazenda São João
  { nome: "FAZENDA SÃO JOÃO", estado: "BA", numero_matricula: "", area_total: 1658.00, valor_hectare: 48241.06, valor_total: 80000000 }
];

async function seedPropriedades() {
  console.log("🌱 Iniciando seed de propriedades...");
  
  const supabase = await createClient();
  
  try {
    // Verificar se já existem propriedades para evitar duplicação
    const { data: existingProps, error: checkError } = await supabase
      .from("propriedades")
      .select("nome")
      .eq("organizacao_id", ORGANIZACAO_TESTE_ID)
      .limit(1);
    
    if (checkError) {
      console.error("❌ Erro ao verificar propriedades existentes:", checkError);
      return;
    }
    
    if (existingProps && existingProps.length > 0) {
      console.log("⚠️  Já existem propriedades cadastradas para esta organização. Pulando seed...");
      return;
    }
    
    // Preparar dados para inserção
    const propriedadesToInsert = propriedades.map((prop) => ({
      organizacao_id: ORGANIZACAO_TESTE_ID,
      nome: prop.nome,
      estado: prop.estado,
      numero_matricula: prop.numero_matricula || null,
      area_total: prop.area_total,
      area_cultivada: prop.area_total, // Assumindo que toda área é cultivada
      valor_atual: prop.valor_total,
      tipo: "PROPRIO",
      status: "ATIVA",
      ano_aquisicao: new Date().getFullYear(), // Ano atual como padrão
      cidade: prop.estado === "BA" ? "Luís Eduardo Magalhães" : "Bom Jesus", // Cidades padrão por estado
      proprietario: "SR Consultoria", // Proprietário padrão
    }));
    
    // Inserir propriedades em lotes de 10
    const batchSize = 10;
    let inserted = 0;
    
    for (let i = 0; i < propriedadesToInsert.length; i += batchSize) {
      const batch = propriedadesToInsert.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from("propriedades")
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Erro ao inserir lote ${i / batchSize + 1}:`, error);
        continue;
      }
      
      inserted += data?.length || 0;
      console.log(`✅ Lote ${i / batchSize + 1} inserido com sucesso (${data?.length} propriedades)`);
    }
    
    console.log(`\n✅ Seed concluído! Total de ${inserted} propriedades inseridas.`);
    
    // Exibir resumo
    const { data: summary, error: summaryError } = await supabase
      .from("propriedades")
      .select("estado, area_total.sum(), valor_atual.sum()")
      .eq("organizacao_id", ORGANIZACAO_TESTE_ID);
    
    if (!summaryError && summary) {
      console.log("\n📊 Resumo das propriedades inseridas:");
      
      // Agrupar por estado
      const estadoTotals = propriedades.reduce((acc, prop) => {
        if (!acc[prop.estado]) {
          acc[prop.estado] = { count: 0, area: 0, valor: 0 };
        }
        acc[prop.estado].count++;
        acc[prop.estado].area += prop.area_total;
        acc[prop.estado].valor += prop.valor_total;
        return acc;
      }, {} as Record<string, { count: number; area: number; valor: number }>);
      
      Object.entries(estadoTotals).forEach(([estado, totals]) => {
        console.log(`- ${estado}: ${totals.count} propriedades, ${totals.area.toFixed(2)} ha, R$ ${totals.valor.toLocaleString("pt-BR")}`);
      });
      
      const totalGeral = propriedades.reduce(
        (acc, prop) => ({
          area: acc.area + prop.area_total,
          valor: acc.valor + prop.valor_total,
        }),
        { area: 0, valor: 0 }
      );
      
      console.log(`\nTOTAL GERAL: ${propriedades.length} propriedades, ${totalGeral.area.toFixed(2)} ha, R$ ${totalGeral.valor.toLocaleString("pt-BR")}`);
    }
    
  } catch (error) {
    console.error("❌ Erro durante o seed:", error);
  }
}

// Executar o seed
if (require.main === module) {
  seedPropriedades().catch(console.error);
}

export { seedPropriedades };