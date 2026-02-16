import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models';

// 登录请求验证
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6)
});

// 注册请求验证
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  password: z.string().min(6),
  department: z.string().optional()
});

export async function authRoutes(app: FastifyInstance) {
  // 登录
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { username, password } = loginSchema.parse(request.body);

      const user = await User.findOne({ where: { username } });
      if (!user) {
        return reply.status(401).send({ error: '用户名或密码错误' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return reply.status(401).send({ error: '用户名或密码错误' });
      }

      // 更新最后登录时间
      await user.update({ lastLoginAt: new Date() });

      // 生成 JWT
      const token = app.jwt.sign({
        id: user.id,
        username: user.username,
        role: user.role
      }, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          department: user.department
        }
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: '请求参数错误', details: error.errors });
      }
      throw error;
    }
  });

  // 注册 (仅管理员可用)
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = registerSchema.parse(request.body);

      // 检查用户名是否已存在
      const existingUser = await User.findOne({ where: { username: data.username } });
      if (existingUser) {
        return reply.status(409).send({ error: '用户名已存在' });
      }

      // 检查邮箱是否已存在
      if (data.email) {
        const existingEmail = await User.findOne({ where: { email: data.email } });
        if (existingEmail) {
          return reply.status(409).send({ error: '邮箱已被使用' });
        }
      }

      // 加密密码
      const passwordHash = await bcrypt.hash(data.password, 10);

      // 创建用户
      const user = await User.create({
        username: data.username,
        email: data.email,
        passwordHash,
        department: data.department
      });

      return reply.status(201).send({
        message: '用户创建成功',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: '请求参数错误', details: error.errors });
      }
      throw error;
    }
  });

  // 获取当前用户
  app.get('/me', { onRequest: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await User.findByPk((request.user as any).id, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      return reply.status(404).send({ error: '用户不存在' });
    }

    return { user };
  });
}

// JWT 验证装饰器
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
}

export function addAuthDecorator(app: FastifyInstance) {
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: '未授权' });
    }
  });
}
