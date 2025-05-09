import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from './index';
import { User } from './user';

// Bill Status enum
export type BillStatus = 'PENDING' | 'PAID' | 'REJECTED';

// Bill attributes interface
export interface BillAttributes {
  id: number;
  blockchainBillId: number | null;
  beneficiaryId: number;
  sponsorId: number;
  paymentDestination: string;
  amount: string;
  description: string;
  category: string | null;
  status: BillStatus;
  isPushedToBlockchain: boolean;
  transactionHash: string | null;
  paidAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Attributes for bill creation
export interface BillCreationAttributes extends Optional<
  BillAttributes, 
  'id' | 'blockchainBillId' | 'isPushedToBlockchain' | 'transactionHash' | 'paidAt' | 'category'
> {}

// Bill model class
export class Bill extends Model<BillAttributes, BillCreationAttributes> implements BillAttributes {
  public id!: number;
  public blockchainBillId!: number | null;
  public beneficiaryId!: number;
  public sponsorId!: number;
  public paymentDestination!: string;
  public amount!: string;
  public description!: string;
  public category!: string | null;
  public status!: BillStatus;
  public isPushedToBlockchain!: boolean;
  public transactionHash!: string | null;
  public paidAt!: Date | null;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly beneficiary?: User;
  public readonly sponsor?: User;
}

// Initialize bill model
Bill.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  blockchainBillId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true
  },
  beneficiaryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sponsorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  paymentDestination: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.STRING, // Using string to avoid precision issues with decimals
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'REJECTED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  isPushedToBlockchain: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  transactionHash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'bills',
  timestamps: true
});

export default Bill; 