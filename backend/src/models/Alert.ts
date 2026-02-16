import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

interface AlertAttributes {
  id: number;
  siteId: number;
  dataId: number;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'closed';
  assignedTo: number;
  resolvedAt: Date;
  createdAt: Date;
}

interface AlertCreationAttributes extends Optional<AlertAttributes, 'id' | 'assignedTo' | 'resolvedAt' | 'createdAt'> {}

export class Alert extends Model<AlertAttributes, AlertCreationAttributes> implements AlertAttributes {
  public id!: number;
  public siteId!: number;
  public dataId!: number;
  public alertType!: string;
  public severity!: 'low' | 'medium' | 'high' | 'critical';
  public title!: string;
  public description!: string;
  public status!: 'open' | 'acknowledged' | 'resolved' | 'closed';
  public assignedTo!: number;
  public resolvedAt!: Date;
  public readonly createdAt!: Date;
}

Alert.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'monitoring_sites',
        key: 'id'
      }
    },
    dataId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'monitoring_data',
        key: 'id'
      }
    },
    alertType: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('open', 'acknowledged', 'resolved', 'closed'),
      defaultValue: 'open'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'alerts',
    timestamps: true,
    updatedAt: false
  }
);
