// Test script for the addPricesSheet function
const { generateCompleteExcelExport } = require('./lib/services/excel-export-service-v3.ts');
const fs = require('fs');

async function testPricesExport() {
  try {
    console.log('Testing Excel export with prices sheet...');
    
    // Wilsemar Elger's organization ID
    const organizationId = '41ee5785-2d48-4f68-a307-d4636d114ab1';
    
    console.log(`Generating Excel export for organization: ${organizationId}`);
    
    const blob = await generateCompleteExcelExport(organizationId);
    
    // Convert blob to buffer and save
    const buffer = Buffer.from(await blob.arrayBuffer());
    const filename = `test_prices_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    fs.writeFileSync(filename, buffer);
    
    console.log(`Excel file saved as: ${filename}`);
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPricesExport();