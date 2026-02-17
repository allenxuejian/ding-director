import { FastifyInstance } from 'fastify';
import { getAgents, getAgentByIdHandler, chat, streamChat, clearConversation } from '../controllers/agentController';

export default async function agentRoutes(fastify: FastifyInstance) {
  fastify.get('/', getAgents);
  fastify.get('/:id', getAgentByIdHandler);
  fastify.post('/chat', chat);
  fastify.post('/stream', streamChat);
  fastify.delete('/conversation/:id', clearConversation);
}
