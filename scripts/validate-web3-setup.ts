import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ABI } from '../backend/types/blockchain';

// Load environment variables from backend .env file if it exists
const envPath = path.join(__dirname, '..', 'backend', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded environment variables from backend/.env');
} else {
  console.log('⚠️ No .env file found in backend directory.');
  console.log('   Using system environment variables instead.');
  dotenv.config();
}

// Check paths
const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts', 'contracts');
const ABIS_DIR = path.join(__dirname, '..', 'backend', 'abis');
const CONFIG_PATH = path.join(__dirname, '..', 'backend', 'config', 'web3Config.ts');
const SERVICE_PATH = path.join(__dirname, '..', 'backend', 'services', 'web3Service.ts');

console.log('\n🔍 Validating Web3 setup...\n');

// Directory and file check interfaces
interface DirectoryCheck {
  path: string;
  name: string;
  optional: boolean;
}

interface FileCheck {
  path: string;
  name: string;
  optional: boolean;
}

// Check if directories and files exist
const directoryChecks: DirectoryCheck[] = [
  { path: ARTIFACTS_DIR, name: 'Artifacts directory', optional: true },
  { path: ABIS_DIR, name: 'ABIs directory', optional: false },
];

const fileChecks: FileCheck[] = [
  { path: path.join(ABIS_DIR, 'U2KToken.json'), name: 'U2KToken ABI file', optional: false },
  { path: path.join(ABIS_DIR, 'BillPaymentSystem.json'), name: 'BillPaymentSystem ABI file', optional: false },
  { path: CONFIG_PATH, name: 'Web3 config file', optional: false },
  { path: SERVICE_PATH, name: 'Web3 service file', optional: false },
];

// Check if ABI files contain valid JSON
function validateAbiFile(filePath: string, name: string): boolean {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data) as ABI;
    
    if (!json.abi || !Array.isArray(json.abi) || json.abi.length === 0) {
      console.log(`❌ ${name} exists but does not contain a valid ABI array.`);
      return false;
    }
    
    console.log(`✅ ${name} contains a valid ABI with ${json.abi.length} entries.`);
    return true;
  } catch (error: any) {
    console.log(`❌ ${name} exists but contains invalid JSON: ${error.message}`);
    return false;
  }
}

// Check for required environment variables
function checkEnvironmentVariables(): boolean {
  const requiredVars = [
    { name: 'U2KTOKEN_ADDRESS', value: process.env.U2KTOKEN_ADDRESS },
    { name: 'BILLPAYMENTSYSTEM_ADDRESS', value: process.env.BILLPAYMENTSYSTEM_ADDRESS },
    { name: 'RPC_URL', value: process.env.RPC_URL },
    { name: 'DATABASE_URL', value: process.env.DATABASE_URL },
    { name: 'JWT_SECRET', value: process.env.JWT_SECRET },
  ];
  
  let allPresent = true;
  
  console.log('\n📋 Checking environment variables:');
  
  for (const variable of requiredVars) {
    if (!variable.value) {
      console.log(`❌ Missing required environment variable: ${variable.name}`);
      allPresent = false;
    } else {
      console.log(`✅ Found environment variable: ${variable.name}`);
    }
  }
  
  return allPresent;
}

// Run the validation
let hasErrors = false;

// Check directories
for (const dir of directoryChecks) {
  if (fs.existsSync(dir.path)) {
    console.log(`✅ ${dir.name} exists at: ${dir.path}`);
  } else {
    if (dir.optional) {
      console.log(`⚠️ Optional ${dir.name} does not exist at: ${dir.path}`);
    } else {
      console.log(`❌ Required ${dir.name} does not exist at: ${dir.path}`);
      hasErrors = true;
    }
  }
}

// Check files
for (const file of fileChecks) {
  if (fs.existsSync(file.path)) {
    console.log(`✅ ${file.name} exists at: ${file.path}`);
    
    if (file.path.endsWith('.json')) {
      if (!validateAbiFile(file.path, file.name)) {
        hasErrors = true;
      }
    }
  } else {
    if (file.optional) {
      console.log(`⚠️ Optional ${file.name} does not exist at: ${file.path}`);
    } else {
      console.log(`❌ Required ${file.name} does not exist at: ${file.path}`);
      hasErrors = true;
    }
  }
}

// Check environment variables
if (!checkEnvironmentVariables()) {
  hasErrors = true;
}

// Try to dynamically load the web3Config to verify it works
console.log('\n🧪 Testing ABI loading:');
try {
  // In TypeScript, we need to use import() dynamically
  import(CONFIG_PATH)
    .then((web3Config) => {
      if (web3Config.U2KTokenABI && Array.isArray(web3Config.U2KTokenABI) && web3Config.U2KTokenABI.length > 0) {
        console.log(`✅ Successfully loaded U2KToken ABI with ${web3Config.U2KTokenABI.length} entries.`);
      } else {
        console.log('❌ Failed to load U2KToken ABI from web3Config.ts');
        hasErrors = true;
      }
      
      if (web3Config.BillPaymentSystemABI && Array.isArray(web3Config.BillPaymentSystemABI) && web3Config.BillPaymentSystemABI.length > 0) {
        console.log(`✅ Successfully loaded BillPaymentSystem ABI with ${web3Config.BillPaymentSystemABI.length} entries.`);
      } else {
        console.log('❌ Failed to load BillPaymentSystem ABI from web3Config.ts');
        hasErrors = true;
      }
      
      // Summary
      console.log('\n📊 Validation Summary:');
      if (hasErrors) {
        console.log('❌ Validation failed. Please fix the issues above before proceeding.');
      } else {
        console.log('✅ All Web3 setup components validated successfully!');
        console.log('🚀 Your backend is ready to integrate with the blockchain.');
      }
      
      // Exit with appropriate code
      process.exit(hasErrors ? 1 : 0);
    })
    .catch((error) => {
      console.log(`❌ Error loading web3Config.ts: ${error.message}`);
      hasErrors = true;
      
      // Summary
      console.log('\n📊 Validation Summary:');
      console.log('❌ Validation failed. Please fix the issues above before proceeding.');
      
      // Exit with error code
      process.exit(1);
    });
} catch (error: any) {
  console.log(`❌ Error loading web3Config.ts: ${error.message}`);
  hasErrors = true;
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log('❌ Validation failed. Please fix the issues above before proceeding.');
  
  // Exit with error code
  process.exit(1);
} 