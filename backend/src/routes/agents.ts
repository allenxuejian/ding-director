import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { AgentConversation } from '../models';

export async function agentRoutes(app: FastifyInstance) {
  // 开始/继续对话
  app.post('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionId, agentType, message } = request.body as any;

      let conversation;

      if (sessionId) {
        // 继续现有会话
        conversation = await AgentConversation.findOne({ where: { sessionId } });
        if (!conversation) {
          return reply.status(404).send({ error: '会话不存在' });
        }

        // 更新消息记录
        const messages = conversation.messages as any[] || [];
        messages.push({
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        });

        // TODO: 调用AI服务生成回复
        const aiResponse = generateAIResponse(agentType, message);

        messages.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        });

        await conversation.update({ messages });

        return {
          sessionId,
          response: aiResponse,
          agentType
        };
      } else {
        // 创建新会话
        const newSessionId = uuidv4();
        const messages = [{
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        }];

        // TODO: 调用AI服务生成回复
        const aiResponse = generateAIResponse(agentType, message);

        messages.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        });

        conversation = await AgentConversation.create({
          sessionId: newSessionId,
          userId: 1, // TODO: 从token获取
          agentType,
          messages,
          context: {}
        });

        return {
          sessionId: newSessionId,
          response: aiResponse,
          agentType
        };
      }
    } catch (error) {
      return reply.status(500).send({ error: '对话处理失败' });
    }
  });

  // 获取会话列表
  app.get('/sessions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const sessions = await AgentConversation.findAll({
        where: { status: 'active' },
        order: [['updatedAt', 'DESC']],
        limit: 50
      });

      return { data: sessions };
    } catch (error) {
      return reply.status(500).send({ error: '获取会话列表失败' });
    }
  });

  // 获取会话详情
  app.get('/sessions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;

      const conversation = await AgentConversation.findOne({
        where: { sessionId: id }
      });

      if (!conversation) {
        return reply.status(404).send({ error: '会话不存在' });
      }

      return { data: conversation };
    } catch (error) {
      return reply.status(500).send({ error: '获取会话详情失败' });
    }
  });

  // 数据分析
  app.post('/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { data, analysisType } = request.body as any;

      // TODO: 调用AI服务进行数据分析
      const analysis = {
        type: analysisType,
        summary: 'AI分析结果...',
        insights: ['洞察1', '洞察2', '洞察3'],
        recommendations: ['建议1', '建议2']
      };

      return { data: analysis };
    } catch (error) {
      return reply.status(500).send({ error: '数据分析失败' });
    }
  });
}

// 模拟AI回复生成
function generateAIResponse(agentType: string, message: string): string {
  const responses: Record<string, string> = {
    ding1: '我是采样专家丁一。根据您的问题，我建议：1. 增加气溶胶采样频率；2. 检查采样设备状态；3. 关注环境温湿度变化。',
    ding2: '我是检测分析师丁二。分析结果：样本检测正常，未检出目标病原体。建议继续保持当前监测频率。',
    ding3: '我是情报专员丁三。最新行业资讯：农业农村部发布新版防疫指南，建议及时关注并调整监测策略。',
    ding4: '我是研报助手丁四。正在为您生成监测日报，包含今日数据统计、异常分析和明日建议。'
  };

  return responses[agentType] || '收到您的问题，我正在分析中...';
}
