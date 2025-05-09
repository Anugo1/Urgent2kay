import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

interface AuthRequest extends Request {
  user?: any;
}

interface JwtPayload {
  id: number;
  [key: string]: any;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Invalid token format.'
      });
    }
    
    try {
      // Verify token
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }
      
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      
      // Get user from database
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found or token invalid'
        });
      }
      
      // Attach user to request
      req.user = user;
      
      next();
    } catch (error: any) {
      console.error('Token verification error:', error.message);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

export default authMiddleware; 