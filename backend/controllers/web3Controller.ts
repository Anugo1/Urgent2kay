import { Request, Response } from 'express';
import web3Service from '../services/web3Service';
import syncService from '../services/syncService';
import { User } from '../models';
import { ethers } from 'ethers';

interface AuthRequest extends Request {
  user?: User;
}

// Create a nonce string for wallet connection
const createNonce = (address: string): string => {
  const timestamp = Date.now();
  return `Authenticate with Urgent2Kay: ${address.toLowerCase()} - ${timestamp}`;
};

const web3Controller = {
  // Get contract addresses
  getContractAddresses: (_req: Request, res: Response) => {
    try {
      const tokenAddress = process.env.U2KTOKEN_ADDRESS;
      const billPaymentSystemAddress = process.env.BILLPAYMENTSYSTEM_ADDRESS;
      
      if (!tokenAddress || !billPaymentSystemAddress) {
        return res.status(500).json({
          success: false,
          message: 'Contract addresses not configured'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          tokenAddress,
          billPaymentSystemAddress,
          rpcUrl: process.env.RPC_URL || ''
        }
      });
    } catch (error: any) {
      console.error('Error getting contract addresses:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching contract addresses',
        error: error.message
      });
    }
  },
  
  // Get authentication nonce
  getNonce: (req: Request, res: Response) => {
    try {
      const { address } = req.query;
      
      if (!address || typeof address !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Wallet address is required'
        });
      }
      
      // Create nonce message
      const nonce = createNonce(address);
      
      return res.status(200).json({
        success: true,
        data: {
          nonce,
          address
        }
      });
    } catch (error: any) {
      console.error('Error generating nonce:', error);
      return res.status(500).json({
        success: false,
        message: 'Error generating authentication nonce',
        error: error.message
      });
    }
  },
  
  // Get token balance
  getTokenBalance: async (req: AuthRequest, res: Response) => {
    try {
      const { address } = req.query;
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      let walletAddress = user.walletAddress;
      
      // If address query param is provided and user has wallet, allow checking that address
      if (address && typeof address === 'string' && ethers.isAddress(address)) {
        walletAddress = address;
      }
      
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'No wallet address available'
        });
      }
      
      const balance = await web3Service.getTokenBalance(walletAddress);
      
      return res.status(200).json({
        success: true,
        data: {
          address: walletAddress,
          balance
        }
      });
    } catch (error: any) {
      console.error('Error getting token balance:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching token balance',
        error: error.message
      });
    }
  },
  
  // Sync user's bills from blockchain
  syncBills: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      if (!user.walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'No wallet connected'
        });
      }
      
      // Sync bills from blockchain
      const result = await syncService.syncUserBills(user.id, user.walletAddress);
      
      return res.status(200).json({
        success: true,
        message: 'Bills synchronized successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error syncing bills:', error);
      return res.status(500).json({
        success: false,
        message: 'Error synchronizing bills from blockchain',
        error: error.message
      });
    }
  },
  
  // Push bill to blockchain
  pushBillToBlockchain: async (req: AuthRequest, res: Response) => {
    try {
      const { billId } = req.params;
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      if (!billId) {
        return res.status(400).json({
          success: false,
          message: 'Bill ID is required'
        });
      }
      
      const result = await syncService.pushBillToBlockchain(parseInt(billId), user.id);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error pushing bill to blockchain:', error);
      return res.status(500).json({
        success: false,
        message: 'Error pushing bill to blockchain',
        error: error.message
      });
    }
  }
};

export default web3Controller; 