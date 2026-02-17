import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import agentRoutes from './routes/agentRoutes';

dotenv.config();

const app = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  }
});

const PORT = parseInt(process.env.PORT || '3001');

async function main() {
  // CORS
  await app.register(cors, { origin: true, credentials: true });
  
  // JWT
  await app.register(jwt, { secret: process.env.JWT_SECRET || 'ding-director-secret' });
  
  // Agent路由
  await app.register(agentRoutes, { prefix: '/api/agents' });
  
  // 健康检查
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '北京畜牧兽医研究所 - AI Agent服务'
  }));
  
  // 根路径
  app.get('/', async () => ({
    name: '北京畜牧兽医研究所 - 智能疫病监测预警平台',
    version: '1.0.0',
    endpoints: {
      agents: '/api/agents',
      health: '/health'
    }
  }));

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 北京畜牧兽医研究所后端服务已启动`);
    console.log(`📡 http://localhost:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
