import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testPropertiesQuery() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("=== Testando consulta de propriedades ===\n");
  
  // 1. Primeiro, vamos verificar se há organizações
  console.log("1. Verificando organizações:");
  const { data: orgs, error: orgsError } = await supabase
    .from("organizacoes")
    .select("id, nome")
    .limit(5);
    
  if (orgsError) {
    console.error("Erro ao buscar organizações:", orgsError);
    return;
  }
  
  console.log(`Encontradas ${orgs?.length || 0} organizações`);
  if (orgs && orgs.length > 0) {
    console.log("Primeiras organizações:", orgs);
  }
  
  // 2. Verificar estrutura da tabela propriedades
  console.log("\n2. Verificando estrutura da tabela propriedades:");
  const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
    table_name: 'propriedades'
  });
  
  if (columnsError) {
    console.error("Erro ao buscar colunas:", columnsError);
    // Tentar buscar propriedades mesmo assim
  } else {
    console.log("Colunas da tabela:", columns);
  }
  
  // 3. Tentar buscar todas as propriedades (sem filtro)
  console.log("\n3. Buscando todas as propriedades (sem filtro):");
  const { data: allProperties, error: allPropsError } = await supabase
    .from("propriedades")
    .select("*")
    .limit(5);
    
  if (allPropsError) {
    console.error("Erro ao buscar todas as propriedades:", allPropsError);
  } else {
    console.log(`Encontradas ${allProperties?.length || 0} propriedades no total`);
    if (allProperties && allProperties.length > 0) {
      console.log("Primeira propriedade:", allProperties[0]);
    }
  }
  
  // 4. Testar busca com organizacao_id específico
  if (orgs && orgs.length > 0) {
    const testOrgId = orgs[0].id;
    console.log(`\n4. Buscando propriedades da organização ${testOrgId}:`);
    
    const { data: orgProperties, error: orgPropsError } = await supabase
      .from("propriedades")
      .select("*")
      .eq("organizacao_id", testOrgId)
      .order("nome");
      
    if (orgPropsError) {
      console.error("Erro ao buscar propriedades da organização:", orgPropsError);
    } else {
      console.log(`Encontradas ${orgProperties?.length || 0} propriedades para esta organização`);
      if (orgProperties && orgProperties.length > 0) {
        console.log("Propriedades encontradas:", orgProperties.map(p => ({ id: p.id, nome: p.nome })));
      }
    }
  }
  
  // 5. Verificar se há algum problema com índices ou constraints
  console.log("\n5. Verificando se há propriedades órfãs (sem organização válida):");
  const { data: orphanProps, error: orphanError } = await supabase
    .from("propriedades")
    .select("id, nome, organizacao_id")
    .is("organizacao_id", null)
    .limit(5);
    
  if (orphanError) {
    console.error("Erro ao buscar propriedades órfãs:", orphanError);
  } else {
    console.log(`Encontradas ${orphanProps?.length || 0} propriedades sem organização`);
    if (orphanProps && orphanProps.length > 0) {
      console.log("Propriedades órfãs:", orphanProps);
    }
  }
  
  console.log("\n=== Teste concluído ===");
}

// Executar o teste
testPropertiesQuery().catch(console.error);