# 丁主任 - 后端 API

智能疫病监测预警平台后端服务

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- PostgreSQL >= 15
- Redis >= 7

### 安装

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库等信息

# 开发模式启动
npm run dev
```

### Docker 部署

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend
```

## 📚 API 文档

启动后访问: http://localhost:3000/documentation

### 主要接口

#### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/me` - 获取当前用户

#### 监测站点
- `GET /api/sites` - 获取站点列表
- `POST /api/sites` - 创建站点
- `GET /api/sites/:id` - 获取站点详情
- `PUT /api/sites/:id` - 更新站点
- `DELETE /api/sites/:id` - 删除站点

#### 监测数据
- `GET /api/monitoring/data` - 获取监测数据
- `POST /api/monitoring/data` - 上报数据
- `GET /api/monitoring/stats` - 统计数据
- `GET /api/monitoring/heatmap` - 热力图数据

#### 预警
- `GET /api/alerts` - 获取预警列表
- `PUT /api/alerts/:id/acknowledge` - 确认预警
- `PUT /api/alerts/:id/resolve` - 解决预警

#### 报告
- `GET /api/reports` - 获取报告列表
- `POST /api/reports` - 创建报告
- `POST /api/reports/generate` - AI生成报告

#### AI Agent
- `POST /api/agents/chat` - 对话
- `GET /api/agents/sessions` - 会话列表

## 🗄️ 数据库模型

### 主要表
- `monitoring_sites` - 监测站点
- `monitoring_data` - 监测数据
- `alerts` - 预警记录
- `reports` - 报告
- `users` - 用户
- `agent_conversations` - AI会话

## 📁 项目结构

```
backend/
├── src/
│   ├── controllers/    # 控制器
│   ├── middleware/     # 中间件
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   ├── services/       # 业务逻辑
│   └── utils/          # 工具函数
├── config/             # 配置文件
├── tests/              # 测试文件
├── package.json
└── Dockerfile
```

## 🔒 安全

- JWT 认证
- 密码哈希 (bcrypt)
- API 速率限制
- 输入验证 (Zod)

## 📝 开发规范

- TypeScript 严格模式
- RESTful API 设计
- 统一的错误处理
- 完善的 API 文档

## 🚧 TODO

- [ ] AI 服务集成
- [ ] 消息队列 (RabbitMQ)
- [ ] 时序数据库 (InfluxDB)
- [ ] 搜索引擎 (Elasticsearch)
- [ ] 文件存储 (MinIO)
- [ ] 测试覆盖
- [ ] CI/CD 流程

## 📄 License

MIT
