import express from 'express';
import web3Controller from '../controllers/web3Controller';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/contracts', web3Controller.getContractAddresses);
router.get('/wallet/nonce', web3Controller.getNonce);

// Protected routes
router.use(authMiddleware);
router.get('/wallet/balance', web3Controller.getTokenBalance);
router.get('/sync', web3Controller.syncBills);
router.post('/bills/:billId/push', web3Controller.pushBillToBlockchain);

export default router; 