import { generateCompleteExcelExport } from './lib/services/excel-export-service-v3';
import { createAdminClient } from './lib/supabase/server';
import * as fs from 'fs';

// ID do Wilsemar Elger
const organizationId = '41ee5785-2d48-4f68-a307-d4636d114ab1';

async function testExcelExport() {
  try {
    console.log('Testando exportação Excel v3...');
    console.log('Organization ID:', organizationId);
    
    // Criar cliente admin para testes
    const supabase = await createAdminClient();
    
    const blob = await generateCompleteExcelExport(organizationId, supabase);
    
    // Converter Blob para Buffer e salvar
    const buffer = Buffer.from(await blob.arrayBuffer());
    const filename = `test_export_v3_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    fs.writeFileSync(filename, buffer);
    console.log(`✅ Arquivo Excel gerado com sucesso: ${filename}`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar Excel:', error);
  }
}

testExcelExport();