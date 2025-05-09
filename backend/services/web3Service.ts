import { ethers, Contract, ContractTransaction, Wallet } from 'ethers';
import * as web3Config from '../config/web3Config';
import { Bill, BillStatus } from '../types/blockchain';

// Check if ABIs were loaded successfully
if (!web3Config.U2KTokenABI || !web3Config.BillPaymentSystemABI) {
  console.error('Error: Failed to load contract ABIs. Make sure they exist in the abis directory or the contracts are compiled.');
  process.exit(1);
}

// Destructure ABIs from web3Config
const { U2KTokenABI, BillPaymentSystemABI } = web3Config;

// Load environment variables
const tokenAddress = process.env.U2KTOKEN_ADDRESS;
const billPaymentSystemAddress = process.env.BILLPAYMENTSYSTEM_ADDRESS;
const rpcUrl = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

// Validate environment variables
if (!tokenAddress || !billPaymentSystemAddress || !rpcUrl) {
  console.error('Error: Missing required environment variables for web3 services.');
  console.error('Please make sure the following are set in your .env file:');
  console.error('- U2KTOKEN_ADDRESS: The address of the U2K token contract');
  console.error('- BILLPAYMENTSYSTEM_ADDRESS: The address of the bill payment system contract');
  console.error('- RPC_URL: The URL of the RPC provider');
  process.exit(1);
}

// Create ethers provider
const provider = new ethers.JsonRpcProvider(rpcUrl);

// Initialize contract instances
const getTokenContract = (signerOrProvider = provider): Contract => {
  return new ethers.Contract(tokenAddress as string, U2KTokenABI, signerOrProvider);
};

const getBillPaymentContract = (signerOrProvider = provider): Contract => {
  return new ethers.Contract(billPaymentSystemAddress as string, BillPaymentSystemABI, signerOrProvider);
};

// Get a signer if private key is available
const getSigner = (): Wallet => {
  if (!privateKey) {
    throw new Error('Private key not configured for signing transactions');
  }
  return new ethers.Wallet(privateKey, provider);
};

// Define response types
interface TransactionResponse {
  success: boolean;
  transactionHash?: string;
  billId?: number;
  error?: string;
}

// Contract interaction methods
const web3Service = {
  // Bill Payment System Contract Methods
  createBill: async (
    beneficiary: string, 
    sponsor: string, 
    paymentDestination: string, 
    amount: number | string, 
    description: string
  ): Promise<TransactionResponse> => {
    try {
      const signer = getSigner();
      const contract = getBillPaymentContract(signer);
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount.toString());
      
      const tx = await contract.createBill(
        sponsor,
        paymentDestination,
        amountInWei,
        description
      ) as ContractTransaction;
      
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }
      
      // Find the BillCreated event from the receipt
      const event = receipt.logs
        .filter(log => log.address.toLowerCase() === billPaymentSystemAddress?.toLowerCase())
        .map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(event => event && event.name === 'BillCreated');
      
      if (!event) {
        throw new Error('Failed to find BillCreated event in transaction receipt');
      }
      
      // Extract billId from the event
      const billId = Number(event.args.billId);
      
      return {
        success: true,
        billId,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error creating bill on blockchain:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  payBillWithNative: async (billId: number, amount: number | string): Promise<TransactionResponse> => {
    try {
      const signer = getSigner();
      const contract = getBillPaymentContract(signer);
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount.toString());
      
      const tx = await contract.payBillWithNative(billId, { value: amountInWei }) as ContractTransaction;
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt?.hash,
      };
    } catch (error: any) {
      console.error('Error paying bill with native currency:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  payBillWithU2K: async (billId: number): Promise<TransactionResponse> => {
    try {
      const signer = getSigner();
      const contract = getBillPaymentContract(signer);
      
      const tx = await contract.payBillWithU2K(billId) as ContractTransaction;
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt?.hash,
      };
    } catch (error: any) {
      console.error('Error paying bill with U2K tokens:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  rejectBill: async (billId: number): Promise<TransactionResponse> => {
    try {
      const signer = getSigner();
      const contract = getBillPaymentContract(signer);
      
      const tx = await contract.rejectBill(billId) as ContractTransaction;
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt?.hash,
      };
    } catch (error: any) {
      console.error('Error rejecting bill:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  getBill: async (billId: number): Promise<Bill | null> => {
    try {
      const contract = getBillPaymentContract();
      const bill = await contract.getBill(billId);
      
      // Format the result
      return {
        id: Number(bill.id),
        beneficiary: bill.beneficiary,
        paymentDestination: bill.paymentDestination,
        sponsor: bill.sponsor,
        amount: ethers.formatEther(bill.amount),
        description: bill.description,
        status: ['PENDING', 'PAID', 'REJECTED'][bill.status] as BillStatus,
        createdAt: new Date(Number(bill.createdAt) * 1000),
        paidAt: bill.paidAt > 0 ? new Date(Number(bill.paidAt) * 1000) : null,
      };
    } catch (error: any) {
      console.error('Error getting bill from blockchain:', error);
      return null;
    }
  },
  
  getBeneficiaryBills: async (beneficiaryAddress: string): Promise<number[]> => {
    try {
      const contract = getBillPaymentContract();
      const billIds = await contract.getBeneficiaryBills(beneficiaryAddress);
      
      // Convert BigInts to Numbers
      return billIds.map(id => Number(id));
    } catch (error: any) {
      console.error('Error getting beneficiary bills:', error);
      return [];
    }
  },
  
  getSponsorBills: async (sponsorAddress: string): Promise<number[]> => {
    try {
      const contract = getBillPaymentContract();
      const billIds = await contract.getSponsorBills(sponsorAddress);
      
      // Convert BigInts to Numbers
      return billIds.map(id => Number(id));
    } catch (error: any) {
      console.error('Error getting sponsor bills:', error);
      return [];
    }
  },
  
  // U2K Token Contract Methods
  getTokenBalance: async (address: string): Promise<string> => {
    try {
      const contract = getTokenContract();
      const balance = await contract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error: any) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  },
  
  getSponsorTokenBalance: async (sponsorAddress: string): Promise<string> => {
    try {
      const contract = getBillPaymentContract();
      const balance = await contract.getSponsorTokenBalance(sponsorAddress);
      return ethers.formatEther(balance);
    } catch (error: any) {
      console.error('Error getting sponsor token balance:', error);
      return '0';
    }
  },
};

export default web3Service; 