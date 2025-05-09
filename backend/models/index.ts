// Sequelize import
const Sequelize = require('sequelize');
import dotenv from 'dotenv';

dotenv.config();

// Initialize Sequelize with PostgreSQL
export const sequelize = new Sequelize(process.env.DATABASE_URL || '', {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Import models
import User from './user';
import Bill from './bill';

// Set up associations
// @ts-ignore: Sequelize static methods not recognized by TypeScript
User.hasMany(Bill, { foreignKey: 'beneficiaryId', as: 'beneficiaryBills' });
// @ts-ignore: Sequelize static methods not recognized by TypeScript
User.hasMany(Bill, { foreignKey: 'sponsorId', as: 'sponsorBills' });
// @ts-ignore: Sequelize static methods not recognized by TypeScript
Bill.belongsTo(User, { foreignKey: 'beneficiaryId', as: 'beneficiary' });
// @ts-ignore: Sequelize static methods not recognized by TypeScript
Bill.belongsTo(User, { foreignKey: 'sponsorId', as: 'sponsor' });

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Export the models and sequelize instance
export { User, Bill, syncDatabase };
export default { sequelize, User, Bill, syncDatabase }; 