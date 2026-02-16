import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

interface MonitoringDataAttributes {
  id: number;
  siteId: number;
  deviceId: string;
  sampleType: string;
  diseaseType: string;
  temperature: number;
  humidity: number;
  phValue: number;
  detectionResult: 'positive' | 'negative' | 'suspect';
  confidence: number;
  rawData: object;
  aiAnalysis: object;
  status: 'normal' | 'abnormal' | 'warning';
  detectedAt: Date;
  createdAt: Date;
}

interface MonitoringDataCreationAttributes extends Optional<MonitoringDataAttributes, 'id' | 'createdAt'> {}

export class MonitoringData extends Model<MonitoringDataAttributes, MonitoringDataCreationAttributes> implements MonitoringDataAttributes {
  public id!: number;
  public siteId!: number;
  public deviceId!: string;
  public sampleType!: string;
  public diseaseType!: string;
  public temperature!: number;
  public humidity!: number;
  public phValue!: number;
  public detectionResult!: 'positive' | 'negative' | 'suspect';
  public confidence!: number;
  public rawData!: object;
  public aiAnalysis!: object;
  public status!: 'normal' | 'abnormal' | 'warning';
  public detectedAt!: Date;
  public readonly createdAt!: Date;
}

MonitoringData.init(
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
    deviceId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    sampleType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    diseaseType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    temperature: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    humidity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    phValue: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true
    },
    detectionResult: {
      type: DataTypes.ENUM('positive', 'negative', 'suspect'),
      allowNull: true
    },
    confidence: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true
    },
    rawData: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    aiAnalysis: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('normal', 'abnormal', 'warning'),
      defaultValue: 'normal'
    },
    detectedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'monitoring_data',
    timestamps: true,
    updatedAt: false
  }
);
