import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';

import { testConnection, initModels } from './models';
import { authRoutes } from './routes/auth';
import { siteRoutes } from './routes/sites';
import { monitoringRoutes } from './routes/monitoring';
import { alertRoutes } from './routes/alerts';
import { reportRoutes } from './routes/reports';
import agentRoutes from './routes/agentRoutes';

dotenv.config();

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    } : undefined
  }
});

// 注册插件
async function registerPlugins() {
  // CORS
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  // JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'ding-director-secret'
  });

  // WebSocket
  await app.register(websocket);

  // Swagger 文档
  await app.register(swagger, {
    openapi: {
      info: {
        title: '北京畜牧兽医研究所 API',
        description: '智能疫病监测预警平台 API',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:3000/api'
        }
      ]
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });
}

// 注册路由
async function registerRoutes() {
  const apiPrefix = process.env.API_PREFIX || '/api';

  await app.register(authRoutes, { prefix: `${apiPrefix}/auth` });
  await app.register(siteRoutes, { prefix: `${apiPrefix}/sites` });
  await app.register(monitoringRoutes, { prefix: `${apiPrefix}/monitoring` });
  await app.register(alertRoutes, { prefix: `${apiPrefix}/alerts` });
  await app.register(reportRoutes, { prefix: `${apiPrefix}/reports` });
  await app.register(agentRoutes, { prefix: `${apiPrefix}/agents` });

  // 健康检查
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  });

  // WebSocket 实时数据
  app.get('/ws/realtime', { websocket: true }, (connection, req) => {
    connection.socket.on('message', (message: string) => {
      const data = JSON.parse(message.toString());
      
      // 处理订阅请求
      if (data.type === 'subscribe') {
        connection.socket.send(JSON.stringify({
          type: 'subscribed',
          channel: data.channel
        }));
      }
    });

    // 发送欢迎消息
    connection.socket.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to Ding Director Realtime'
    }));
  });
}

// 启动服务器
async function start() {
  try {
    // 测试数据库连接
    await testConnection();
    await initModels();

    // 注册插件和路由
    await registerPlugins();
    await registerRoutes();

    // 启动
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    
    app.log.info(`🚀 北京畜牧兽医研究所后端服务已启动`);
    app.log.info(`📚 API文档: http://${host}:${port}/documentation`);
    app.log.info(`💚 健康检查: http://${host}:${port}/health`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
