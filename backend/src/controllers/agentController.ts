/**
 * Agent Controller - 内存存储版本
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { chatWithAgent, streamWithAgent } from '../ai/service';
import { getAllAgents, getAgentById } from '../agents/config';

// 内存对话缓存
const conversationCache = new Map<string, Array<{ role: string; content: string }>>();

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

  return reply.send({ success: true, data: agents });
}

export async function getAgentByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const agent = getAgentById(req.params.id);
  
  if (!agent) {
    return reply.status(404).send({ success: false, error: 'Agent not found' });
  }

  return reply.send({
    success: true,
    data: {
      id: agent.id, name: agent.name, title: agent.title,
      avatar: agent.avatar, role: agent.role, color: agent.color,
      expertise: agent.expertise, personality: agent.personality, greeting: agent.greeting
    }
  });
}

export async function chat(
  req: FastifyRequest<{
    Body: { agentId: string; message: string; conversationId?: string; context?: any; }
  }>,
  reply: FastifyReply
) {
  try {
    const { agentId, message, conversationId, context } = req.body;

    const agent = getAgentById(agentId);
    if (!agent) {
      return reply.status(404).send({ success: false, error: 'Agent not found' });
    }

    const cacheKey = conversationId || `demo-${agentId}`;
    const history = conversationCache.get(cacheKey) || [];
    const trimmedHistory = history.slice(-20);

    const response = await chatWithAgent(agentId, message, trimmedHistory, context);

    const updatedHistory = [...trimmedHistory, { role: 'user', content: message }, { role: 'assistant', content: response.content }];
    conversationCache.set(cacheKey, updatedHistory);

    return reply.send({
      success: true,
      data: {
        content: response.content,
        agent: { id: agent.id, name: agent.name, avatar: agent.avatar },
        metadata: { model: response.model, tokens: response.tokens, latency: response.latency }
      }
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function streamChat(
  req: FastifyRequest<{
    Body: { agentId: string; message: string; conversationId?: string; context?: any; }
  }>,
  reply: FastifyReply
) {
  try {
    const { agentId, message, conversationId, context } = req.body;

    const agent = getAgentById(agentId);
    if (!agent) {
      return reply.status(404).send({ success: false, error: 'Agent not found' });
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const cacheKey = conversationId || `demo-${agentId}`;
    const history = conversationCache.get(cacheKey) || [];
    const trimmedHistory = history.slice(-20);

    reply.raw.write(`data: ${JSON.stringify({ type: 'start', agent: { id: agent.id, name: agent.name, avatar: agent.avatar } })}

`);

    let fullContent = '';
    const startTime = Date.now();

    try {
      for await (const chunk of streamWithAgent(agentId, message, trimmedHistory, context)) {
        if (chunk.content) {
          fullContent += chunk.content;
          reply.raw.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk.content })}

`);
        }
        if (chunk.done) break;
      }

      const updatedHistory = [...trimmedHistory, { role: 'user', content: message }, { role: 'assistant', content: fullContent }];
      conversationCache.set(cacheKey, updatedHistory);

      reply.raw.write(`data: ${JSON.stringify({ type: 'end', metadata: { latency: Date.now() - startTime } })}

`);
      reply.raw.end();
    } catch (streamError: any) {
      reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: streamError.message })}

`);
      reply.raw.end();
    }
  } catch (error: any) {
    reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}

`);
    reply.raw.end();
  }
}

export async function clearConversation(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  conversationCache.delete(req.params.id);
  return reply.send({ success: true, message: 'Conversation cleared' });
}
