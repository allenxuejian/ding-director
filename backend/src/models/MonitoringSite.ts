import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

interface MonitoringSiteAttributes {
  id: number;
  siteCode: string;
  name: string;
  type: string;
  province: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  contactName: string;
  contactPhone: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

interface MonitoringSiteCreationAttributes extends Optional<MonitoringSiteAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class MonitoringSite extends Model<MonitoringSiteAttributes, MonitoringSiteCreationAttributes> implements MonitoringSiteAttributes {
  public id!: number;
  public siteCode!: string;
  public name!: string;
  public type!: string;
  public province!: string;
  public city!: string;
  public district!: string;
  public address!: string;
  public lat!: number;
  public lng!: number;
  public contactName!: string;
  public contactPhone!: string;
  public status!: 'active' | 'inactive' | 'maintenance';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MonitoringSite.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    siteCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    province: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    district: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    contactName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
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
    tableName: 'monitoring_sites',
    timestamps: true
  }
);
