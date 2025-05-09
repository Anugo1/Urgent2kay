import express from 'express';
import billController from '../controllers/billController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Bill routes
router.post('/create', billController.createBill);
router.post('/:billId/pay', billController.payBill);
router.post('/:billId/reject', billController.rejectBill);
router.get('/:billId', billController.getBill);
router.get('/sponsor/list', billController.getSponsorBills);
router.get('/beneficiary/list', billController.getBeneficiaryBills);
router.post('/:billId/sync', billController.syncBillWithBlockchain);

export default router; 