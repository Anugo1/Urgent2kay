import * as Sequelize from 'sequelize';
import { User } from '../models/user';
import { Bill } from '../models/bill';

declare module 'sequelize' {
  // Extend Model interface to include proper association methods
  interface Model {
    // Association methods
    hasMany<M extends Model>(
      this: ModelCtor<M>,
      target: ModelCtor<Model>,
      options?: AssociationOptions
    ): HasMany;
    belongsTo<M extends Model>(
      this: ModelCtor<M>,
      target: ModelCtor<Model>,
      options?: AssociationOptions
    ): BelongsTo;
  }
}

// Add this to make the file a module
export {}; 