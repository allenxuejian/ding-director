import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

interface ReportAttributes {
  id: number;
  title: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'industry';
  content: string;
  summary: string;
  dataRangeStart: Date;
  dataRangeEnd: Date;
  aiGenerated: boolean;
  generatedBy: string;
  fileUrl: string;
  viewCount: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
}

interface ReportCreationAttributes extends Optional<ReportAttributes, 'id' | 'viewCount' | 'createdAt'> {}

export class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  public id!: number;
  public title!: string;
  public reportType!: 'daily' | 'weekly' | 'monthly' | 'industry';
  public content!: string;
  public summary!: string;
  public dataRangeStart!: Date;
  public dataRangeEnd!: Date;
  public aiGenerated!: boolean;
  public generatedBy!: string;
  public fileUrl!: string;
  public viewCount!: number;
  public status!: 'draft' | 'published' | 'archived';
  public readonly createdAt!: Date;
}

Report.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    reportType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'industry'),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dataRangeStart: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    dataRangeEnd: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    aiGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    generatedBy: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'published'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'reports',
    timestamps: true,
    updatedAt: false
  }
);
