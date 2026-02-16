import { Sequelize } from 'sequelize';
import { MonitoringSite } from './MonitoringSite';
import { MonitoringData } from './MonitoringData';
import { Alert } from './Alert';
import { User } from './User';
import { Report } from './Report';
import { AgentConversation } from './AgentConversation';

// 数据库连接
export const sequelize = new Sequelize(
  process.env.DB_NAME || 'ding_director',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 初始化所有模型
export const initModels = async () => {
  // 定义模型关系
  MonitoringSite.hasMany(MonitoringData, { foreignKey: 'siteId' });
  MonitoringData.belongsTo(MonitoringSite, { foreignKey: 'siteId' });
  
  MonitoringSite.hasMany(Alert, { foreignKey: 'siteId' });
  Alert.belongsTo(MonitoringSite, { foreignKey: 'siteId' });
  
  MonitoringData.hasMany(Alert, { foreignKey: 'dataId' });
  Alert.belongsTo(MonitoringData, { foreignKey: 'dataId' });

  // 同步数据库 (开发环境使用 alter, 生产使用 migrations)
  if (process.env.NODE_ENV === 'development') {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced (alter mode)');
  }
};

// 测试连接
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

// 导出所有模型
export {
  MonitoringSite,
  MonitoringData,
  Alert,
  User,
  Report,
  AgentConversation
};
