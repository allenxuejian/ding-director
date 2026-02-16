import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { MonitoringSite } from '../models';

// 创建站点验证
const createSiteSchema = z.object({
  siteCode: z.string().min(1),
  name: z.string().min(1),
  type: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional()
});

export async function siteRoutes(app: FastifyInstance) {
  // 获取所有站点
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 20, province, city, status } = request.query as any;
      
      const where: any = {};
      if (province) where.province = province;
      if (city) where.city = city;
      if (status) where.status = status;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const { count, rows } = await MonitoringSite.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']]
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
      return reply.status(500).send({ error: '获取站点列表失败' });
    }
  });

  // 获取单个站点
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      
      const site = await MonitoringSite.findByPk(id);
      if (!site) {
        return reply.status(404).send({ error: '站点不存在' });
      }

      return { data: site };
    } catch (error) {
      return reply.status(500).send({ error: '获取站点详情失败' });
    }
  });

  // 创建站点
  app.post('/', { onRequest: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createSiteSchema.parse(request.body);

      // 检查站点编号是否已存在
      const existingSite = await MonitoringSite.findOne({ where: { siteCode: data.siteCode } });
      if (existingSite) {
        return reply.status(409).send({ error: '站点编号已存在' });
      }

      const site = await MonitoringSite.create(data);

      return reply.status(201).send({
        message: '站点创建成功',
        data: site
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: '请求参数错误', details: error.errors });
      }
      throw error;
    }
  });

  // 更新站点
  app.put('/:id', { onRequest: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const data = createSiteSchema.partial().parse(request.body);

      const site = await MonitoringSite.findByPk(id);
      if (!site) {
        return reply.status(404).send({ error: '站点不存在' });
      }

      await site.update(data);

      return {
        message: '站点更新成功',
        data: site
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: '请求参数错误', details: error.errors });
      }
      throw error;
    }
  });

  // 删除站点
  app.delete('/:id', { onRequest: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;

      const site = await MonitoringSite.findByPk(id);
      if (!site) {
        return reply.status(404).send({ error: '站点不存在' });
      }

      await site.destroy();

      return { message: '站点删除成功' };
    } catch (error) {
      return reply.status(500).send({ error: '删除站点失败' });
    }
  });

  // 获取站点统计数据
  app.get('/stats/overview', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const total = await MonitoringSite.count();
      const active = await MonitoringSite.count({ where: { status: 'active' } });
      const maintenance = await MonitoringSite.count({ where: { status: 'maintenance' } });
      const inactive = await MonitoringSite.count({ where: { status: 'inactive' } });

      // 按省份统计
      const byProvince = await MonitoringSite.findAll({
        attributes: ['province', [MonitoringSite.sequelize!.fn('COUNT', '*'), 'count']],
        group: ['province'],
        raw: true
      });

      return {
        data: {
          total,
          active,
          maintenance,
          inactive,
          byProvince
        }
      };
    } catch (error) {
      return reply.status(500).send({ error: '获取统计数据失败' });
    }
  });
}
