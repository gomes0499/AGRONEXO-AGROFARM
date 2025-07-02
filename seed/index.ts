import { seedPropriedades } from "./seed-propriedades";

async function runSeeds() {
  console.log("🚀 Iniciando processo de seed...\n");
  
  try {
    // Seed de propriedades
    await seedPropriedades();
    
    // Adicione outras funções de seed aqui conforme necessário
    // await seedCulturas();
    // await seedSafras();
    // etc...
    
    console.log("\n✅ Processo de seed concluído com sucesso!");
  } catch (error) {
    console.error("\n❌ Erro durante o processo de seed:", error);
    process.exit(1);
  }
}

// Executar seeds
runSeeds();