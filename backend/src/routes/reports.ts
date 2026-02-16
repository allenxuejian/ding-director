import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Report } from '../models';

export async function reportRoutes(app: FastifyInstance) {
  // 获取报告列表
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 20, reportType } = request.query as any;

      const where: any = {};
      if (reportType) where.reportType = reportType;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await Report.findAndCountAll({
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
      return reply.status(500).send({ error: '获取报告列表失败' });
    }
  });

  // 获取报告详情
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;

      const report = await Report.findByPk(id);
      if (!report) {
        return reply.status(404).send({ error: '报告不存在' });
      }

      // 增加浏览次数
      await report.increment('viewCount');

      return { data: report };
    } catch (error) {
      return reply.status(500).send({ error: '获取报告详情失败' });
    }
  });

  // 创建报告
  app.post('/', { onRequest: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as any;

      const report = await Report.create({
        ...data,
        generatedBy: (request.user as any).username
      });

      return reply.status(201).send({
        message: '报告创建成功',
        data: report
      });
    } catch (error) {
      return reply.status(500).send({ error: '创建报告失败' });
    }
  });

  // AI生成报告
  app.post('/generate', { onRequest: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { reportType, dataRangeStart, dataRangeEnd } = request.body as any;

      // TODO: 调用AI服务生成报告
      const aiContent = `AI生成的${reportType}报告内容...`;

      const report = await Report.create({
        title: `${reportType}报告 - ${new Date().toLocaleDateString()}`,
        reportType,
        content: aiContent,
        aiGenerated: true,
        generatedBy: 'AI',
        dataRangeStart,
        dataRangeEnd
      });

      return reply.status(201).send({
        message: 'AI报告生成成功',
        data: report
      });
    } catch (error) {
      return reply.status(500).send({ error: '生成报告失败' });
    }
  });

  // 删除报告
  app.delete('/:id', { onRequest: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;

      const report = await Report.findByPk(id);
      if (!report) {
        return reply.status(404).send({ error: '报告不存在' });
      }

      await report.destroy();

      return { message: '报告删除成功' };
    } catch (error) {
      return reply.status(500).send({ error: '删除报告失败' });
    }
  });
}
