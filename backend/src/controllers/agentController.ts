/**
 * Agent Controller
 * 处理AI Agent对话请求
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { chatWithAgent, streamWithAgent } from '../ai/service';
import { getAllAgents, getAgentById } from '../agents/config';
import AgentConversation from '../models/AgentConversation';

// 对话历史缓存（生产环境应使用Redis）
const conversationCache = new Map<string, Array<{ role: string; content: string }>>();

/**
 * 获取所有Agent信息
 */
export async function getAgents(req: FastifyRequest, reply: FastifyReply) {
  const agents = getAllAgents().map(agent => ({
    id: agent.id,
    name: agent.name,
    title: agent.title,
    avatar: agent.avatar,
    role: agent.role,
    color: agent.color,
    expertise: agent.expertise,
    greeting: agent.greeting
  }));

  return reply.send({
    success: true,
    data: agents
  });
}

/**
 * 获取单个Agent详情
 */
export async function getAgentByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const agent = getAgentById(req.params.id);
  
  if (!agent) {
    return reply.status(404).send({
      success: false,
      error: 'Agent not found'
    });
  }

  return reply.send({
    success: true,
    data: {
      id: agent.id,
      name: agent.name,
      title: agent.title,
      avatar: agent.avatar,
      role: agent.role,
      color: agent.color,
      expertise: agent.expertise,
      personality: agent.personality,
      greeting: agent.greeting
    }
  });
}

/**
 * 非流式对话
 */
export async function chat(
  req: FastifyRequest<{
    Body: {
      agentId: string;
      message: string;
      conversationId?: string;
      context?: any;
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { agentId, message, conversationId, context } = req.body;

    // 验证Agent存在
    const agent = getAgentById(agentId);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: 'Agent not found'
      });
    }

    // 获取对话历史
    const cacheKey = conversationId || `${(req as any).user?.id || 'anonymous'}-${agentId}`;
    const history = conversationCache.get(cacheKey) || [];

    // 限制历史记录长度（保留最近10轮对话）
    const trimmedHistory = history.slice(-20);

    // 调用AI服务
    const response = await chatWithAgent(agentId, message, trimmedHistory, context);

    // 更新对话历史
    const updatedHistory = [
      ...trimmedHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: response.content }
    ];
    conversationCache.set(cacheKey, updatedHistory);

    // 保存到数据库
    try {
      const userId = (req as any).user?.id || 'anonymous';
      const [conv] = await AgentConversation.findOrCreate({
        where: { id: conversationId || cacheKey },
        defaults: {
          id: conversationId || cacheKey,
          userId,
          agentId,
          context: context || {},
          messages: []
        }
      });

      await conv.update({
        messages: [
          ...conv.messages,
          {
            id: Date.now().toString(),
            agentId,
            content: message,
            role: 'user',
            timestamp: new Date()
          },
          {
            id: (Date.now() + 1).toString(),
            agentId,
            content: response.content,
            role: 'agent',
            timestamp: new Date(),
            metadata: {
              model: response.model,
              tokens: response.tokens.total,
              latency: response.latency
            }
          }
        ]
      });
    } catch (dbError) {
      console.error('Failed to save conversation:', dbError);
      // 不影响响应
    }

    return reply.send({
      success: true,
      data: {
        content: response.content,
        agent: {
          id: agent.id,
          name: agent.name,
          avatar: agent.avatar
        },
        metadata: {
          model: response.model,
          tokens: response.tokens,
          latency: response.latency
        }
      }
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

/**
 * 流式对话（SSE）
 */
export async function streamChat(
  req: FastifyRequest<{
    Body: {
      agentId: string;
      message: string;
      conversationId?: string;
      context?: any;
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { agentId, message, conversationId, context } = req.body;

    // 验证Agent存在
    const agent = getAgentById(agentId);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: 'Agent not found'
      });
    }

    // 设置SSE响应头
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // 获取对话历史
    const cacheKey = conversationId || `${(req as any).user?.id || 'anonymous'}-${agentId}`;
    const history = conversationCache.get(cacheKey) || [];
    const trimmedHistory = history.slice(-20);

    // 发送开始标记
    reply.raw.write(`data: ${JSON.stringify({ type: 'start', agent: { id: agent.id, name: agent.name, avatar: agent.avatar } })}\n\n`);

    // 流式响应
    let fullContent = '';
    const startTime = Date.now();

    try {
      for await (const chunk of streamWithAgent(agentId, message, trimmedHistory, context)) {
        if (chunk.content) {
          fullContent += chunk.content;
          reply.raw.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk.content })}\n\n`);
        }

        if (chunk.done) {
          break;
        }
      }

      // 更新对话历史
      const updatedHistory = [
        ...trimmedHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: fullContent }
      ];
      conversationCache.set(cacheKey, updatedHistory);

      // 发送结束标记
      const latency = Date.now() - startTime;
      reply.raw.write(`data: ${JSON.stringify({ type: 'end', metadata: { latency } })}\n\n`);
      reply.raw.end();

    } catch (streamError: any) {
      reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: streamError.message })}\n\n`);
      reply.raw.end();
    }

  } catch (error: any) {
    console.error('Stream chat error:', error);
    reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    reply.raw.end();
  }
}

/**
 * 清除对话历史
 */
export async function clearConversation(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = req.params;
  conversationCache.delete(id);

  try {
    await AgentConversation.destroy({ where: { id } });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
  }

  return reply.send({
    success: true,
    message: 'Conversation cleared'
  });
}
