import asyncio
import subprocess
import json

# Testar a nova exportação v3 do Excel
async def test_excel_v3():
    # Criar um arquivo Node.js para testar a função
    test_code = '''
const { testExcelExportWilsemar } = require('./lib/actions/excel-export-actions-v3');

async function test() {
    console.log('Iniciando teste da exportação Excel v3...');
    
    try {
        const result = await testExcelExportWilsemar();
        
        if (result.success) {
            console.log('✅ Exportação realizada com sucesso!');
            console.log('Filename:', result.filename);
            console.log('Data size:', result.data.length, 'bytes');
            
            // Salvar o arquivo
            const fs = require('fs');
            fs.writeFileSync('./docs/' + result.filename, result.data);
            console.log('Arquivo salvo em:', './docs/' + result.filename);
            
        } else {
            console.log('❌ Erro na exportação:', result.error);
        }
    } catch (error) {
        console.error('❌ Erro ao executar teste:', error);
    }
}

test();
'''
    
    # Escrever o arquivo de teste
    with open('/Users/guilhermeoliveiragomes/Projects/SR-CONSULTORIA/test_excel_v3.js', 'w') as f:
        f.write(test_code)
    
    # Executar o teste
    result = subprocess.run(['node', 'test_excel_v3.js'], 
                          capture_output=True, text=True, 
                          cwd='/Users/guilhermeoliveiragomes/Projects/SR-CONSULTORIA')
    
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
    print("Return code:", result.returncode)

if __name__ == "__main__":
    asyncio.run(test_excel_v3())