import { Bill, User } from '../models';
import web3Service from './web3Service';
import { Op } from 'sequelize';
import { BillStatus } from '../types/blockchain';

interface SyncResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

const syncService = {
  // Sync a single bill from blockchain to database
  syncBillFromBlockchain: async (blockchainBillId: number): Promise<SyncResponse> => {
    try {
      // Get bill from blockchain
      const blockchainBill = await web3Service.getBill(blockchainBillId);
      
      if (!blockchainBill) {
        return {
          success: false,
          message: `Bill with ID ${blockchainBillId} not found on blockchain`
        };
      }
      
      // Check if bill exists in database
      let bill = await Bill.findOne({ where: { blockchainBillId } });
      
      if (bill) {
        // Update existing bill
        await bill.update({
          status: blockchainBill.status,
          paidAt: blockchainBill.paidAt,
          isPushedToBlockchain: true
        });
        
        return {
          success: true,
          message: 'Bill updated from blockchain',
          data: bill
        };
      } else {
        // Find beneficiary and sponsor by wallet address
        const beneficiary = await User.findOne({ 
          where: { walletAddress: blockchainBill.beneficiary }
        });
        
        const sponsor = await User.findOne({ 
          where: { walletAddress: blockchainBill.sponsor }
        });
        
        if (!beneficiary || !sponsor) {
          return {
            success: false,
            message: 'Beneficiary or sponsor not found in database'
          };
        }
        
        // Create new bill in database
        bill = await Bill.create({
          blockchainBillId,
          beneficiaryId: beneficiary.id,
          sponsorId: sponsor.id,
          paymentDestination: blockchainBill.paymentDestination,
          amount: blockchainBill.amount,
          description: blockchainBill.description,
          status: blockchainBill.status,
          isPushedToBlockchain: true,
          paidAt: blockchainBill.paidAt
        });
        
        return {
          success: true,
          message: 'New bill imported from blockchain',
          data: bill
        };
      }
    } catch (error: any) {
      console.error('Error syncing bill from blockchain:', error);
      return {
        success: false,
        message: 'Error syncing bill from blockchain',
        error: error.message
      };
    }
  },
  
  // Push a bill from database to blockchain
  pushBillToBlockchain: async (billId: number, userId: number): Promise<SyncResponse> => {
    try {
      // Get bill from database
      const bill = await Bill.findOne({
        where: { id: billId },
        include: [
          { model: User, as: 'beneficiary' },
          { model: User, as: 'sponsor' }
        ]
      });
      
      if (!bill) {
        return {
          success: false,
          message: 'Bill not found'
        };
      }
      
      // Check if bill already exists on blockchain
      if (bill.isPushedToBlockchain) {
        return {
          success: false,
          message: 'Bill is already on blockchain'
        };
      }
      
      // Check if user is either beneficiary or sponsor
      if (bill.beneficiaryId !== userId && bill.sponsorId !== userId) {
        return {
          success: false,
          message: 'Unauthorized: User is neither beneficiary nor sponsor of this bill'
        };
      }
      
      // Check if both users have wallet addresses
      const beneficiary = bill.beneficiary as User;
      const sponsor = bill.sponsor as User;
      
      if (!beneficiary.walletAddress || !sponsor.walletAddress) {
        return {
          success: false,
          message: 'Both beneficiary and sponsor must have connected wallets'
        };
      }
      
      // Create bill on blockchain
      const result = await web3Service.createBill(
        beneficiary.walletAddress,
        sponsor.walletAddress,
        bill.paymentDestination,
        bill.amount,
        bill.description
      );
      
      if (!result.success) {
        return {
          success: false,
          message: 'Failed to create bill on blockchain',
          error: result.error
        };
      }
      
      // Update bill with blockchain information
      await bill.update({
        blockchainBillId: result.billId,
        isPushedToBlockchain: true,
        transactionHash: result.transactionHash
      });
      
      return {
        success: true,
        message: 'Bill pushed to blockchain successfully',
        data: {
          billId: bill.id,
          blockchainBillId: result.billId,
          transactionHash: result.transactionHash
        }
      };
    } catch (error: any) {
      console.error('Error pushing bill to blockchain:', error);
      return {
        success: false,
        message: 'Error pushing bill to blockchain',
        error: error.message
      };
    }
  },
  
  // Sync all bills for a user from blockchain
  syncUserBills: async (userId: number, walletAddress: string): Promise<SyncResponse> => {
    try {
      // Get user
      const user = await User.findByPk(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      if (user.walletAddress !== walletAddress) {
        return {
          success: false,
          message: 'Wallet address mismatch'
        };
      }
      
      // Get bills from blockchain
      const beneficiaryBillIds = await web3Service.getBeneficiaryBills(walletAddress);
      const sponsorBillIds = await web3Service.getSponsorBills(walletAddress);
      
      // Combine and deduplicate bill IDs
      const allBillIds = [...new Set([...beneficiaryBillIds, ...sponsorBillIds])];
      
      // Get existing blockchain bill IDs from database
      const existingBills = await Bill.findAll({
        where: {
          blockchainBillId: { [Op.in]: allBillIds },
          isPushedToBlockchain: true
        },
        attributes: ['blockchainBillId']
      });
      
      const existingBillIds = new Set(existingBills.map(bill => bill.blockchainBillId));
      
      // Filter out bills that are already in the database
      const newBillIds = allBillIds.filter(id => !existingBillIds.has(id));
      
      // Sync each new bill
      const syncResults = await Promise.all(
        newBillIds.map(id => syncService.syncBillFromBlockchain(id))
      );
      
      const successCount = syncResults.filter(result => result.success).length;
      
      return {
        success: true,
        message: `Synced ${successCount} new bills from blockchain`,
        data: {
          total: allBillIds.length,
          new: newBillIds.length,
          synced: successCount,
          details: syncResults
        }
      };
    } catch (error: any) {
      console.error('Error syncing user bills:', error);
      return {
        success: false,
        message: 'Error syncing bills from blockchain',
        error: error.message
      };
    }
  },
  
  // Update status of bills from blockchain
  updateBillStatuses: async (): Promise<SyncResponse> => {
    try {
      // Get all bills that are on blockchain and not in final state
      const bills = await Bill.findAll({
        where: {
          isPushedToBlockchain: true,
          blockchainBillId: { [Op.not]: null },
          status: 'PENDING'
        }
      });
      
      if (bills.length === 0) {
        return {
          success: true,
          message: 'No pending bills to update'
        };
      }
      
      // Update each bill
      const updateResults = await Promise.all(
        bills.map(async (bill) => {
          try {
            const blockchainBill = await web3Service.getBill(bill.blockchainBillId as number);
            
            if (!blockchainBill) {
              return {
                billId: bill.id,
                success: false,
                message: 'Bill not found on blockchain'
              };
            }
            
            if (blockchainBill.status !== bill.status) {
              await bill.update({
                status: blockchainBill.status as BillStatus,
                paidAt: blockchainBill.paidAt
              });
              
              return {
                billId: bill.id,
                success: true,
                message: `Status updated from ${bill.status} to ${blockchainBill.status}`
              };
            }
            
            return {
              billId: bill.id,
              success: true,
              message: 'No status change needed'
            };
          } catch (error: any) {
            return {
              billId: bill.id,
              success: false,
              message: error.message
            };
          }
        })
      );
      
      const updatedCount = updateResults.filter(
        result => result.success && result.message.includes('Status updated')
      ).length;
      
      return {
        success: true,
        message: `Updated ${updatedCount} bills`,
        data: {
          total: bills.length,
          updated: updatedCount,
          details: updateResults
        }
      };
    } catch (error: any) {
      console.error('Error updating bill statuses:', error);
      return {
        success: false,
        message: 'Error updating bill statuses from blockchain',
        error: error.message
      };
    }
  }
};

export default syncService; 