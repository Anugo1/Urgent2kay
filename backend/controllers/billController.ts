import { Request, Response } from 'express';
import billService from '../services/billService';

interface AuthRequest extends Request {
  user?: {
    id: number;
    walletAddress: string;
    [key: string]: any;
  };
  body: any;
  params: any;
}

const billController = {
  createBill: async (req: AuthRequest, res: Response) => {
    try {
      const { beneficiaryId, paymentDestination, amount, description } = req.body;
      const sponsorId = req.user?.id;
      
      if (!sponsorId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      if (!beneficiaryId || !paymentDestination || !amount || !description) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      const result = await billService.createBill({
        beneficiaryId,
        sponsorId,
        paymentDestination,
        amount,
        description
      });
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(201).json(result);
    } catch (error: any) {
      console.error('Error in bill controller (createBill):', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating bill',
        error: error.message
      });
    }
  },
  
  payBill: async (req: AuthRequest, res: Response) => {
    try {
      const { billId } = req.params;
      const { useToken, amount } = req.body;
      
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      if (!billId) {
        return res.status(400).json({
          success: false,
          message: 'Bill ID is required'
        });
      }
      
      const result = await billService.payBill(
        parseInt(billId), 
        Boolean(useToken), 
        amount
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in bill controller (payBill):', error);
      return res.status(500).json({
        success: false,
        message: 'Error paying bill',
        error: error.message
      });
    }
  },
  
  rejectBill: async (req: AuthRequest, res: Response) => {
    try {
      const { billId } = req.params;
      
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      if (!billId) {
        return res.status(400).json({
          success: false,
          message: 'Bill ID is required'
        });
      }
      
      const result = await billService.rejectBill(parseInt(billId));
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in bill controller (rejectBill):', error);
      return res.status(500).json({
        success: false,
        message: 'Error rejecting bill',
        error: error.message
      });
    }
  },
  
  getBill: async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      if (!billId) {
        return res.status(400).json({
          success: false,
          message: 'Bill ID is required'
        });
      }
      
      const result = await billService.getBill(parseInt(billId));
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in bill controller (getBill):', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching bill',
        error: error.message
      });
    }
  },
  
  getSponsorBills: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const result = await billService.getSponsorBills(userId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in bill controller (getSponsorBills):', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching sponsor bills',
        error: error.message
      });
    }
  },
  
  getBeneficiaryBills: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const result = await billService.getBeneficiaryBills(userId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in bill controller (getBeneficiaryBills):', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching beneficiary bills',
        error: error.message
      });
    }
  },
  
  syncBillWithBlockchain: async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      if (!billId) {
        return res.status(400).json({
          success: false,
          message: 'Bill ID is required'
        });
      }
      
      const result = await billService.syncBillWithBlockchain(parseInt(billId));
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in bill controller (syncBillWithBlockchain):', error);
      return res.status(500).json({
        success: false,
        message: 'Error synchronizing bill with blockchain',
        error: error.message
      });
    }
  }
};

export default billController; 