import { Bill, User } from '../models';
import web3Service from './web3Service';

interface CreateBillInput {
  beneficiaryId: number;
  sponsorId: number;
  paymentDestination: string;
  amount: string;
  description: string;
}

interface BillResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

const billService = {
  createBill: async (billData: CreateBillInput): Promise<BillResponse> => {
    try {
      // Get the beneficiary and sponsor from database
      const beneficiary = await User.findByPk(billData.beneficiaryId);
      const sponsor = await User.findByPk(billData.sponsorId);
      
      if (!beneficiary || !sponsor) {
        return { 
          success: false, 
          message: 'Beneficiary or sponsor not found' 
        };
      }
      
      // Create bill on blockchain
      const blockchainResult = await web3Service.createBill(
        beneficiary.walletAddress,
        sponsor.walletAddress,
        billData.paymentDestination,
        billData.amount,
        billData.description
      );
      
      if (!blockchainResult.success) {
        return {
          success: false,
          message: 'Failed to create bill on blockchain',
          error: blockchainResult.error
        };
      }
      
      // Save bill to database
      const bill = await Bill.create({
        blockchainBillId: blockchainResult.billId as number,
        beneficiaryId: billData.beneficiaryId,
        sponsorId: billData.sponsorId,
        paymentDestination: billData.paymentDestination,
        amount: billData.amount,
        description: billData.description,
        status: 'PENDING',
        transactionHash: blockchainResult.transactionHash
      });
      
      return {
        success: true,
        message: 'Bill created successfully',
        data: {
          id: bill.id,
          blockchainBillId: bill.blockchainBillId,
          status: bill.status,
          transactionHash: bill.transactionHash
        }
      };
    } catch (error: any) {
      console.error('Error in bill service (createBill):', error);
      return {
        success: false,
        message: 'Error creating bill',
        error: error.message
      };
    }
  },
  
  payBill: async (billId: number, useToken: boolean, amount?: string): Promise<BillResponse> => {
    try {
      // Find the bill in database
      const bill = await Bill.findOne({ where: { id: billId } });
      
      if (!bill) {
        return {
          success: false,
          message: 'Bill not found'
        };
      }
      
      if (bill.status !== 'PENDING') {
        return {
          success: false,
          message: `Bill is already ${bill.status}`
        };
      }
      
      // Pay bill on blockchain
      let blockchainResult;
      
      if (useToken) {
        blockchainResult = await web3Service.payBillWithU2K(bill.blockchainBillId);
      } else {
        if (!amount) {
          return {
            success: false,
            message: 'Amount is required for native currency payment'
          };
        }
        blockchainResult = await web3Service.payBillWithNative(bill.blockchainBillId, amount);
      }
      
      if (!blockchainResult.success) {
        return {
          success: false,
          message: 'Failed to pay bill on blockchain',
          error: blockchainResult.error
        };
      }
      
      // Update bill in database
      await bill.update({
        status: 'PAID',
        transactionHash: blockchainResult.transactionHash,
        paidAt: new Date()
      });
      
      return {
        success: true,
        message: 'Bill paid successfully',
        data: {
          id: bill.id,
          blockchainBillId: bill.blockchainBillId,
          status: bill.status,
          transactionHash: blockchainResult.transactionHash
        }
      };
    } catch (error: any) {
      console.error('Error in bill service (payBill):', error);
      return {
        success: false,
        message: 'Error paying bill',
        error: error.message
      };
    }
  },
  
  rejectBill: async (billId: number): Promise<BillResponse> => {
    try {
      // Find the bill in database
      const bill = await Bill.findOne({ where: { id: billId } });
      
      if (!bill) {
        return {
          success: false,
          message: 'Bill not found'
        };
      }
      
      if (bill.status !== 'PENDING') {
        return {
          success: false,
          message: `Bill is already ${bill.status}`
        };
      }
      
      // Reject bill on blockchain
      const blockchainResult = await web3Service.rejectBill(bill.blockchainBillId);
      
      if (!blockchainResult.success) {
        return {
          success: false,
          message: 'Failed to reject bill on blockchain',
          error: blockchainResult.error
        };
      }
      
      // Update bill in database
      await bill.update({
        status: 'REJECTED',
        transactionHash: blockchainResult.transactionHash
      });
      
      return {
        success: true,
        message: 'Bill rejected successfully',
        data: {
          id: bill.id,
          blockchainBillId: bill.blockchainBillId,
          status: bill.status,
          transactionHash: blockchainResult.transactionHash
        }
      };
    } catch (error: any) {
      console.error('Error in bill service (rejectBill):', error);
      return {
        success: false,
        message: 'Error rejecting bill',
        error: error.message
      };
    }
  },
  
  getBill: async (billId: number): Promise<BillResponse> => {
    try {
      // Find the bill in database with related users
      const bill = await Bill.findOne({
        where: { id: billId },
        include: [
          { model: User, as: 'beneficiary', attributes: ['id', 'username', 'email', 'walletAddress'] },
          { model: User, as: 'sponsor', attributes: ['id', 'username', 'email', 'walletAddress'] }
        ]
      });
      
      if (!bill) {
        return {
          success: false,
          message: 'Bill not found'
        };
      }
      
      // Get bill from blockchain for verification
      const blockchainBill = await web3Service.getBill(bill.blockchainBillId);
      
      // Combine database and blockchain data
      return {
        success: true,
        data: {
          ...bill.get({ plain: true }),
          blockchain: blockchainBill
        }
      };
    } catch (error: any) {
      console.error('Error in bill service (getBill):', error);
      return {
        success: false,
        message: 'Error fetching bill',
        error: error.message
      };
    }
  },
  
  getSponsorBills: async (userId: number): Promise<BillResponse> => {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      // Get bills from database
      const bills = await Bill.findAll({
        where: { sponsorId: userId },
        include: [
          { model: User, as: 'beneficiary', attributes: ['id', 'username', 'email', 'walletAddress'] }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      // Verify with blockchain
      const blockchainBillIds = await web3Service.getSponsorBills(user.walletAddress);
      
      return {
        success: true,
        data: {
          bills,
          blockchainBillCount: blockchainBillIds.length
        }
      };
    } catch (error: any) {
      console.error('Error in bill service (getSponsorBills):', error);
      return {
        success: false,
        message: 'Error fetching sponsor bills',
        error: error.message
      };
    }
  },
  
  getBeneficiaryBills: async (userId: number): Promise<BillResponse> => {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      // Get bills from database
      const bills = await Bill.findAll({
        where: { beneficiaryId: userId },
        include: [
          { model: User, as: 'sponsor', attributes: ['id', 'username', 'email', 'walletAddress'] }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      // Verify with blockchain
      const blockchainBillIds = await web3Service.getBeneficiaryBills(user.walletAddress);
      
      return {
        success: true,
        data: {
          bills,
          blockchainBillCount: blockchainBillIds.length
        }
      };
    } catch (error: any) {
      console.error('Error in bill service (getBeneficiaryBills):', error);
      return {
        success: false,
        message: 'Error fetching beneficiary bills',
        error: error.message
      };
    }
  },

  syncBillWithBlockchain: async (billId: number): Promise<BillResponse> => {
    try {
      const bill = await Bill.findOne({ where: { id: billId } });
      
      if (!bill) {
        return {
          success: false,
          message: 'Bill not found'
        };
      }
      
      // Get bill from blockchain
      const blockchainBill = await web3Service.getBill(bill.blockchainBillId);
      
      if (!blockchainBill) {
        return {
          success: false,
          message: 'Bill not found on blockchain'
        };
      }
      
      // Update database record with blockchain state
      await bill.update({
        status: blockchainBill.status,
        paidAt: blockchainBill.paidAt
      });
      
      return {
        success: true,
        message: 'Bill synchronized with blockchain',
        data: {
          id: bill.id,
          blockchainBillId: bill.blockchainBillId,
          status: bill.status,
          paidAt: bill.paidAt
        }
      };
    } catch (error: any) {
      console.error('Error in bill service (syncBillWithBlockchain):', error);
      return {
        success: false,
        message: 'Error synchronizing bill with blockchain',
        error: error.message
      };
    }
  }
};

export default billService; 