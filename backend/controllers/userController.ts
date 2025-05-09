import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models';
import web3Service from '../services/web3Service';
import { ethers } from 'ethers';

// Define proper User model interface
interface UserModel {
  id: number;
  username: string;
  email: string;
  walletAddress: string | null;
  password: string;
  isPasswordMatch(password: string): Promise<boolean>;
  update(values: Partial<UserModel>): Promise<any>;
}

// Define User static model
interface UserStatic {
  findOne(options: any): Promise<UserModel | null>;
  create(values: Partial<UserModel>): Promise<UserModel>;
  sequelize?: {
    getDialect(): string;
  };
}

// Ensure User is treated as UserStatic
const UserModel = User as unknown as UserStatic;

interface AuthRequest extends Request {
  user?: UserModel;
  body: any;
  params: any;
}

// Helper function to generate JWT
const generateToken = (id: number): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  // @ts-ignore - Ignoring type error for JWT signing
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRY || '24h'
  });
};

const userController = {
  // Register a new user
  register: async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required fields'
        });
      }
      
      // Check if user already exists
      const userExists = await UserModel.findOne({ where: { email } });
      
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      
      // Create user
      const user = await UserModel.create({
        username,
        email,
        password
      });
      
      // Generate token
      const token = generateToken(user.id);
      
      return res.status(201).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          walletAddress: user.walletAddress,
          token
        }
      });
    } catch (error: any) {
      console.error('Error in user registration:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating user account',
        error: error.message
      });
    }
  },
  
  // Login user
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password'
        });
      }
      
      // Find user
      const user = await UserModel.findOne({ where: { email } });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Check password
      const isMatch = await user.isPasswordMatch(password);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Generate token
      const token = generateToken(user.id);
      
      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          walletAddress: user.walletAddress,
          token
        }
      });
    } catch (error: any) {
      console.error('Error in user login:', error);
      return res.status(500).json({
        success: false,
        message: 'Error logging in',
        error: error.message
      });
    }
  },
  
  // Get user profile
  getProfile: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      let tokenBalance = '0';
      
      // If wallet is connected, get token balance
      if (user.walletAddress) {
        tokenBalance = await web3Service.getTokenBalance(user.walletAddress);
      }
      
      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          walletAddress: user.walletAddress,
          tokenBalance
        }
      });
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user profile',
        error: error.message
      });
    }
  },
  
  // Connect wallet
  connectWallet: async (req: AuthRequest, res: Response) => {
    try {
      const { walletAddress, signature, message } = req.body;
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      if (!walletAddress || !signature || !message) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address, signature, and message are required'
        });
      }
      
      // Verify signature
      try {
        const signerAddress = ethers.verifyMessage(message, signature);
        
        if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: 'Invalid signature'
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Signature validation failed'
        });
      }
      
      // Check if wallet is already associated with another account
      const existingUser = await UserModel.findOne({ 
        where: { 
          walletAddress,
          id: { [UserModel.sequelize?.getDialect() === 'postgres' ? 'ne' : 'not']: user.id } 
        } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Wallet is already connected to another account'
        });
      }
      
      // Update user's wallet address
      await user.update({ walletAddress });
      
      return res.status(200).json({
        success: true,
        message: 'Wallet connected successfully',
        data: {
          walletAddress
        }
      });
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      return res.status(500).json({
        success: false,
        message: 'Error connecting wallet',
        error: error.message
      });
    }
  },
  
  // Disconnect wallet
  disconnectWallet: async (req: AuthRequest, res: Response) => {
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
      
      // Update user to remove wallet address
      await user.update({ walletAddress: null });
      
      return res.status(200).json({
        success: true,
        message: 'Wallet disconnected successfully'
      });
    } catch (error: any) {
      console.error('Error disconnecting wallet:', error);
      return res.status(500).json({
        success: false,
        message: 'Error disconnecting wallet',
        error: error.message
      });
    }
  }
};

export default userController; 