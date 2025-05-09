// Global declaration for sequelize
declare module 'sequelize' {
  import * as SequelizeNS from 'sequelize';
  export = SequelizeNS;
} 