import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { MonitoringData, MonitoringSite } from '../models';

// 创建监测数据验证
const createDataSchema = z.object({
  siteId: z.number(),
  deviceId: z.string().optional(),
  sampleType: z.string(),
  diseaseType: z.string(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  phValue: z.number().optional(),
  detectionResult: z.enum(['positive', 'negative', 'suspect']),
  confidence: z.number().min(0).max(1).optional(),
  rawData: z.object({}).optional(),
  aiAnalysis: z.object({}).optional(),
  detectedAt: z.string().datetime()
});

export async function monitoringRoutes(app: FastifyInstance) {
  // 获取监测数据列表
  app.get('/data', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        siteId, 
        diseaseType, 
        detectionResult,
        startDate,
        endDate 
      } = request.query as any;

      const where: any = {};
      if (siteId) where.siteId = parseInt(siteId);
      if (diseaseType) where.diseaseType = diseaseType;
      if (detectionResult) where.detectionResult = detectionResult;
      if (startDate || endDate) {
        where.detectedAt = {};
        if (startDate) where.detectedAt[Op.gte] = new Date(startDate);
        if (endDate) where.detectedAt[Op.lte] = new Date(endDate);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await MonitoringData.findAndCountAll({
        where,
        include: [{
          model: MonitoringSite,
          attributes: ['name', 'siteCode', 'province', 'city']
        }],
        limit: parseInt(limit),
        offset,
        order: [['detectedAt', 'DESC']]
      });

      return {
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      };
    } catch (error) {
      return reply.status(500).send({ error: '获取监测数据失败' });
    }
  });

  // 上报监测数据（设备调用）
  app.post('/data', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createDataSchema.parse(request.body);

      // 自动判断状态
      let status = 'normal';
      if (data.detectionResult === 'positive') {
        status = 'warning';
      } else if (data.detectionResult === 'suspect') {
        status = 'abnormal';
      }

      const monitoringData = await MonitoringData.create({
        ...data,
        detectedAt: new Date(data.detectedAt),
        status
      });

      // 如果是异常数据，触发预警
      if (status !== 'normal') {
        // TODO: 触发预警逻辑
      }

      return reply.status(201).send({
        message: '数据上报成功',
        data: monitoringData
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: '请求参数错误', details: error.errors });
      }
      throw error;
    }
  });

  // 获取统计数据
  app.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { days = 7 } = request.query as any;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // 总数据量
      const totalCount = await MonitoringData.count({
        where: {
          detectedAt: {
            [Op.gte]: startDate
          }
        }
      });

      // 异常数据
      const abnormalCount = await MonitoringData.count({
        where: {
          status: {
            [Op.in]: ['abnormal', 'warning']
          },
          detectedAt: {
            [Op.gte]: startDate
          }
        }
      });

      // 按结果统计
      const byResult = await MonitoringData.findAll({
        attributes: [
          'detectionResult',
          [MonitoringData.sequelize!.fn('COUNT', '*'), 'count']
        ],
        where: {
          detectedAt: {
            [Op.gte]: startDate
          }
        },
        group: ['detectionResult'],
        raw: true
      });

      // 按日期统计趋势
      const trends = await MonitoringData.findAll({
        attributes: [
          [MonitoringData.sequelize!.fn('DATE', MonitoringData.sequelize!.col('detected_at')), 'date'],
          [MonitoringData.sequelize!.fn('COUNT', '*'), 'count']
        ],
        where: {
          detectedAt: {
            [Op.gte]: startDate
          }
        },
        group: [MonitoringData.sequelize!.fn('DATE', MonitoringData.sequelize!.col('detected_at'))],
        order: [[MonitoringData.sequelize!.fn('DATE', MonitoringData.sequelize!.col('detected_at')), 'ASC']],
        raw: true
      });

      return {
        data: {
          totalCount,
          abnormalCount,
          abnormalRate: totalCount > 0 ? ((abnormalCount / totalCount) * 100).toFixed(2) + '%' : '0%',
          byResult,
          trends
        }
      };
    } catch (error) {
      return reply.status(500).send({ error: '获取统计数据失败' });
    }
  });

  // 获取热力图数据
  app.get('/heatmap', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await MonitoringData.findAll({
        include: [{
          model: MonitoringSite,
          attributes: ['lat', 'lng', 'name'],
          where: {
            lat: { [Op.not]: null },
            lng: { [Op.not]: null }
          }
        }],
        where: {
          status: {
            [Op.in]: ['abnormal', 'warning']
          }
        },
        limit: 1000,
        order: [['detectedAt', 'DESC']]
      });

      const heatmapData = data.map((item: any) => ({
        lat: item.MonitoringSite.lat,
        lng: item.MonitoringSite.lng,
        value: item.detectionResult === 'positive' ? 1 : 0.5,
        name: item.MonitoringSite.name,
        result: item.detectionResult
      }));

      return { data: heatmapData };
    } catch (error) {
      return reply.status(500).send({ error: '获取热力图数据失败' });
    }
  });
}

// 导入 Sequelize 操作符
import { Op } from 'sequelize';
