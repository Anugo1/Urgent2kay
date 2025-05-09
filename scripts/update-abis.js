const fs = require('fs');
const path = require('path');

// Paths
const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts', 'contracts');
const ABIS_DIR = path.join(__dirname, '..', 'backend', 'abis');

// Ensure the abis directory exists
if (!fs.existsSync(ABIS_DIR)) {
  fs.mkdirSync(ABIS_DIR, { recursive: true });
  console.log(`Created directory: ${ABIS_DIR}`);
}

// Contracts to update
const contracts = [
  'U2KToken',
  'BillPaymentSystem'
];

// Extract and save ABI for a contract
const updateAbi = (contractName) => {
  const sourcePath = path.join(ARTIFACTS_DIR, `${contractName}.sol`, `${contractName}.json`);
  const destPath = path.join(ABIS_DIR, `${contractName}.json`);
  
  try {
    if (fs.existsSync(sourcePath)) {
      // Read the artifact
      const artifact = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      
      // Create a simplified version with just the ABI
      const abiFile = {
        abi: artifact.abi
      };
      
      // Write the ABI to the destination file
      fs.writeFileSync(destPath, JSON.stringify(abiFile, null, 2));
      console.log(`✅ Updated ABI for ${contractName}`);
      return true;
    } else {
      console.error(`❌ Contract artifact not found for ${contractName} at ${sourcePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ABI for ${contractName}:`, error);
    return false;
  }
};

// Main function
const main = async () => {
  console.log('🔄 Updating ABIs from compiled contracts...');
  
  let successCount = 0;
  
  for (const contract of contracts) {
    if (updateAbi(contract)) {
      successCount++;
    }
  }
  
  console.log(`\n📊 Updated ${successCount}/${contracts.length} ABIs`);
  
  if (successCount === contracts.length) {
    console.log('✨ All ABIs updated successfully!');
  } else {
    console.log('⚠️ Some ABIs could not be updated. Please check the errors above.');
    process.exit(1);
  }
};

// Run the script
main().catch(error => {
  console.error('Error in main function:', error);
  process.exit(1);
}); 