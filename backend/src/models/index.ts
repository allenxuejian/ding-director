/**
 * 简化版模型初始化 - 避免循环依赖
 */

import { Sequelize, DataTypes, Model } from 'sequelize';

// 数据库连接
export const sequelize = new Sequelize(
  process.env.DB_NAME || 'ding_director',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  }
);

// AgentConversation 模型
export class AgentConversation extends Model {}

AgentConversation.init(
  {
    id: { type: DataTypes.STRING(255), primaryKey: true },
    userId: { type: DataTypes.STRING(255), allowNull: false },
    agentId: { type: DataTypes.STRING(100), allowNull: false },
    context: { type: DataTypes.JSONB, defaultValue: {} },
    messages: { type: DataTypes.JSONB, defaultValue: [] }
  },
  { sequelize, tableName: 'agent_conversations', timestamps: true }
);

// 测试连接
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection OK');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // 不退出，允许无数据库模式运行
  }
};

// 初始化模型
export const initModels = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    // 不退出，允许无数据库模式运行
  }
};
