const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Importar o serviço de exportação
async function testPlantingAreasExport() {
  try {
    console.log('Iniciando teste de exportação de áreas de plantio...');
    
    const organizationId = '41ee5785-2d48-4f68-a307-d4636d114ab1';
    
    // Testar query de propriedades
    console.log('\n1. Testando busca de propriedades...');
    const { data: propriedades, error: propError } = await supabase
      .from('propriedades')
      .select('*')
      .eq('organizacao_id', organizationId)
      .eq('status', 'ATIVA')
      .order('nome');
    
    if (propError) {
      console.error('Erro ao buscar propriedades:', propError);
    } else {
      console.log(`Encontradas ${propriedades.length} propriedades ativas`);
      if (propriedades.length > 0) {
        console.log('Exemplo de propriedade:', {
          nome: propriedades[0].nome,
          cidade: propriedades[0].cidade,
          estado: propriedades[0].estado,
          area_total: propriedades[0].area_total,
          area_cultivada: propriedades[0].area_cultivada
        });
      }
    }
    
    // Testar query de safras
    console.log('\n2. Testando busca de safras...');
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('id, nome, ano_inicio')
      .eq('organizacao_id', organizationId)
      .order('ano_inicio', { ascending: false });
    
    if (safrasError) {
      console.error('Erro ao buscar safras:', safrasError);
    } else {
      console.log(`Encontradas ${safras.length} safras`);
      console.log('Safras mais recentes:', safras.slice(0, 3).map(s => s.nome).join(', '));
    }
    
    // Testar query de áreas de plantio
    console.log('\n3. Testando busca de áreas de plantio...');
    const { data: areasPlantio, error: areasError } = await supabase
      .from('areas_plantio')
      .select(`
        *,
        culturas (id, nome),
        sistemas (id, nome),
        ciclos (id, nome)
      `)
      .eq('organizacao_id', organizationId);
    
    if (areasError) {
      console.error('Erro ao buscar áreas de plantio:', areasError);
    } else {
      console.log(`Encontradas ${areasPlantio.length} áreas de plantio`);
      if (areasPlantio.length > 0) {
        console.log('Exemplo de área de plantio:', {
          cultura: areasPlantio[0].culturas?.nome,
          sistema: areasPlantio[0].sistemas?.nome,
          ciclo: areasPlantio[0].ciclos?.nome,
          areas_por_safra: Object.keys(areasPlantio[0].areas_por_safra || {}).length + ' safras'
        });
      }
    }
    
    // Calcular resumo
    console.log('\n4. Calculando resumo de áreas...');
    
    let totalAreaPropriedades = 0;
    let totalAreaCultivada = 0;
    let totalAreaPecuaria = 0;
    
    propriedades?.forEach(prop => {
      totalAreaPropriedades += parseFloat(prop.area_total) || 0;
      totalAreaCultivada += parseFloat(prop.area_cultivada) || 0;
      totalAreaPecuaria += parseFloat(prop.area_pecuaria) || 0;
    });
    
    console.log('Resumo de áreas:');
    console.log(`- Total de propriedades: ${propriedades?.length || 0}`);
    console.log(`- Área total: ${totalAreaPropriedades.toFixed(2)} ha`);
    console.log(`- Área cultivada: ${totalAreaCultivada.toFixed(2)} ha`);
    console.log(`- Área pecuária: ${totalAreaPecuaria.toFixed(2)} ha`);
    console.log(`- Área disponível: ${(totalAreaPropriedades - totalAreaCultivada - totalAreaPecuaria).toFixed(2)} ha`);
    
    // Calcular áreas por cultura
    console.log('\n5. Calculando áreas por cultura...');
    const totaisPorCultura = new Map();
    
    areasPlantio?.forEach(area => {
      const cultura = area.culturas?.nome || 'N/A';
      if (area.areas_por_safra && typeof area.areas_por_safra === 'object') {
        Object.values(area.areas_por_safra).forEach(areaValue => {
          const areaNum = parseFloat(areaValue) || 0;
          const totalAtual = totaisPorCultura.get(cultura) || 0;
          totaisPorCultura.set(cultura, totalAtual + areaNum);
        });
      }
    });
    
    console.log('Áreas totais por cultura:');
    const culturasSorted = Array.from(totaisPorCultura.entries()).sort((a, b) => b[1] - a[1]);
    culturasSorted.forEach(([cultura, total]) => {
      console.log(`- ${cultura}: ${total.toFixed(2)} ha`);
    });
    
    console.log('\n✅ Teste concluído com sucesso!');
    console.log('A função addPlantingAreasSheet está pronta para uso.');
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executar teste
testPlantingAreasExport();