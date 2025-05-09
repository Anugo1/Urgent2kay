import fs from 'fs';
import path from 'path';
import { ABI } from '../types/blockchain';

// Paths for ABIs
const ABIS_DIR = path.join(__dirname, '..', 'abis');
const U2K_TOKEN_ABI_PATH = path.join(ABIS_DIR, 'U2KToken.json');
const BILL_PAYMENT_SYSTEM_ABI_PATH = path.join(ABIS_DIR, 'BillPaymentSystem.json');

// Function to load ABI from file
const loadABI = (filePath: string): any[] => {
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonContent: ABI = JSON.parse(fileContent);
      
      // Check if it's a full contract artifact or just the ABI
      if (Array.isArray(jsonContent)) {
        return jsonContent;
      } else if (jsonContent.abi && Array.isArray(jsonContent.abi)) {
        return jsonContent.abi;
      } else {
        console.error(`Error: Invalid ABI format in ${filePath}`);
        return [];
      }
    } else {
      console.error(`Error: ABI file not found at ${filePath}`);
      return [];
    }
  } catch (error) {
    console.error(`Error loading ABI from ${filePath}:`, error);
    return [];
  }
};

// Load ABIs
export const U2KTokenABI = loadABI(U2K_TOKEN_ABI_PATH);
export const BillPaymentSystemABI = loadABI(BILL_PAYMENT_SYSTEM_ABI_PATH);

// Export contract addresses from environment variables
export const tokenAddress = process.env.U2KTOKEN_ADDRESS;
export const billPaymentSystemAddress = process.env.BILLPAYMENTSYSTEM_ADDRESS; 