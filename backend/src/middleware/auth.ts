/**
 * 认证中间件
 * 简化版 - 允许演示token通过
 */

import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    
    // 演示模式：允许demo-token
    if (authHeader === 'Bearer demo-token') {
      (request as any).user = { id: 'demo-user', role: 'admin' };
      return;
    }
    
    // 生产环境JWT验证
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized - Missing token'
      });
    }

    const token = authHeader.substring(7);
    
    // 验证JWT (使用fastify-jwt)
    try {
      const decoded = await request.jwtVerify();
      (request as any).user = decoded;
    } catch (err) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized - Invalid token'
      });
    }
  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized'
    });
  }
}
