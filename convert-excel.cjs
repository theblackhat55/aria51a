const XLSX = require('xlsx');
const fs = require('fs');

function convertExcelToJSON(filename, outputname) {
  try {
    const workbook = XLSX.readFile(filename);
    const sheetName = workbook.SheetNames[0]; // First sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`\n=== ${filename} ===`);
    console.log(`Sheet: ${sheetName}`);
    console.log(`Total rows: ${data.length}`);
    
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]).join(', '));
      console.log('\nFirst few rows:');
      console.log(JSON.stringify(data.slice(0, 3), null, 2));
    }
    
    fs.writeFileSync(outputname, JSON.stringify(data, null, 2));
    console.log(`\nConverted to: ${outputname}`);
    
    return data;
  } catch (error) {
    console.error(`Error converting ${filename}:`, error.message);
    return null;
  }
}

// Convert both files
console.log('Converting Excel files to JSON...');
convertExcelToJSON('iso27001.xlsx', 'iso27001.json');
convertExcelToJSON('uae_isr.xlsx', 'uae_isr.json');
console.log('\nConversion complete!');