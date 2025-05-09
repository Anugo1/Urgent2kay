import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from './index';
import bcrypt from 'bcrypt';

// User attributes interface
export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  walletAddress: string | null;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Attributes for user creation
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'isEmailVerified' | 'walletAddress'> {}

// User model class
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public walletAddress!: string | null;
  public role!: 'user' | 'admin';
  public isEmailVerified!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Method to check if password matches
  public async isPasswordMatch(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

// Initialize user model
User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user'
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeSave: async (user: User) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

export default User; 