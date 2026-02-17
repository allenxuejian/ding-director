/**
 * Agent Routes
 * AI Agent 相关API路由
 */

import { FastifyInstance } from 'fastify';
import {
  getAgents,
  getAgentByIdHandler,
  chat,
  streamChat,
  clearConversation
} from '../controllers/agentController';
import { authenticate } from '../middlewares/auth';

export default async function agentRoutes(fastify: FastifyInstance) {
  // 公开路由
  fastify.get('/', getAgents);
  fastify.get('/:id', getAgentByIdHandler);

  // 需要认证的路由
  fastify.post('/chat', { preHandler: authenticate }, chat);
  fastify.post('/stream', { preHandler: authenticate }, streamChat);
  fastify.delete('/conversation/:id', { preHandler: authenticate }, clearConversation);
}
