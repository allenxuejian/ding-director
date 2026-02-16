import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

interface AgentConversationAttributes {
  id: number;
  userId: number;
  sessionId: string;
  agentType: 'ding1' | 'ding2' | 'ding3' | 'ding4';
  messages: object;
  context: object;
  status: 'active' | 'completed' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

interface AgentConversationCreationAttributes extends Optional<AgentConversationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class AgentConversation extends Model<AgentConversationAttributes, AgentConversationCreationAttributes> implements AgentConversationAttributes {
  public id!: number;
  public userId!: number;
  public sessionId!: string;
  public agentType!: 'ding1' | 'ding2' | 'ding3' | 'ding4';
  public messages!: object;
  public context!: object;
  public status!: 'active' | 'completed' | 'expired';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AgentConversation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sessionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    agentType: {
      type: DataTypes.ENUM('ding1', 'ding2', 'ding3', 'ding4'),
      allowNull: false
    },
    messages: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    context: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'expired'),
      defaultValue: 'active'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'agent_conversations',
    timestamps: true
  }
);
