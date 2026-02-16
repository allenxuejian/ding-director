import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Alert } from '../models';

export async function alertRoutes(app: FastifyInstance) {
  // 获取预警列表
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 20, severity, status } = request.query as any;

      const where: any = {};
      if (severity) where.severity = severity;
      if (status) where.status = status;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await Alert.findAndCountAll({
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
      return reply.status(500).send({ error: '获取预警列表失败' });
    }
  });

  // 确认预警
  app.put('/:id/acknowledge', { onRequest: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;

      const alert = await Alert.findByPk(id);
      if (!alert) {
        return reply.status(404).send({ error: '预警不存在' });
      }

      await alert.update({ 
        status: 'acknowledged',
        assignedTo: (request.user as any).id
      });

      return { message: '预警已确认', data: alert };
    } catch (error) {
      return reply.status(500).send({ error: '确认预警失败' });
    }
  });

  // 解决预警
  app.put('/:id/resolve', { onRequest: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;

      const alert = await Alert.findByPk(id);
      if (!alert) {
        return reply.status(404).send({ error: '预警不存在' });
      }

      await alert.update({ 
        status: 'resolved',
        resolvedAt: new Date()
      });

      return { message: '预警已解决', data: alert };
    } catch (error) {
      return reply.status(500).send({ error: '解决预警失败' });
    }
  });

  // 获取预警统计
  app.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const openCount = await Alert.count({ where: { status: 'open' } });
      const acknowledgedCount = await Alert.count({ where: { status: 'acknowledged' } });
      const resolvedCount = await Alert.count({ where: { status: 'resolved' } });

      const bySeverity = await Alert.findAll({
        attributes: ['severity', [Alert.sequelize!.fn('COUNT', '*'), 'count']],
        group: ['severity'],
        raw: true
      });

      return {
        data: {
          openCount,
          acknowledgedCount,
          resolvedCount,
          bySeverity
        }
      };
    } catch (error) {
      return reply.status(500).send({ error: '获取预警统计失败' });
    }
  });
}
