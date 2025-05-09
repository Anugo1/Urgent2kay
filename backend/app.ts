import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { syncDatabase } from './models';

// Import routes
import userRoutes from './routes/userRoutes';
import billRoutes from './routes/billRoutes';
import web3Routes from './routes/web3Routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Morgan logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/users', userRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/web3', web3Routes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the Urgent2Kay API',
    version: '1.0.0',
    status: 'online'
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to PostgreSQL database
    await syncDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 