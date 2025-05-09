import express from 'express';
import userController from '../controllers/userController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.use(authMiddleware);
router.get('/profile', userController.getProfile);
router.post('/wallet/connect', userController.connectWallet);
router.post('/wallet/disconnect', userController.disconnectWallet);

export default router; 