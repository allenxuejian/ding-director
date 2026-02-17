# 北京畜牧兽医研究所 - 战备级后台系统设计方案

## 🎯 目标
从静态原型升级为**真正的战备级疫病监测预警平台**

## 📐 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ 首页    │  │ Chat    │  │ 报告页  │  │ 管理后台│        │
│  │(Dashboard)│  │ (Agents) │  │(Reports)│  │ (Admin) │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
└───────┼────────────┼────────────┼────────────┼──────────────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                           │
                    ┌──────┴──────┐
                    │   API Gateway│
                    │   (Kong/Nginx)│
                    └──────┬──────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    服务层 (Backend)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ 监测服务     │  │ AI Agent服务 │  │ 报告服务     │       │
│  │ (Monitoring) │  │ (Agents)     │  │ (Reports)    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ 用户服务     │  │ 告警服务     │  │ 数据采集服务 │       │
│  │ (Auth/User)  │  │ (Alert)      │  │ (Collector)  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    数据层 (Data)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ PostgreSQL   │  │ Redis        │  │ InfluxDB     │       │
│  │ (主数据库)   │  │ (缓存/会话)  │  │ (时序数据)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Elasticsearch│  │ MinIO/S3     │  │ MQTT Broker  │       │
│  │ (搜索/日志)  │  │ (文件存储)   │  │ (IoT消息)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    基础设施层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Docker       │  │ Kubernetes   │  │ Prometheus   │       │
│  │ (容器化)     │  │ (编排)       │  │ (监控)       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ 数据库设计

### 1. 监测站点表 (monitoring_sites)
```sql
CREATE TABLE monitoring_sites (
    id SERIAL PRIMARY KEY,
    site_code VARCHAR(50) UNIQUE NOT NULL,  -- 站点编号
    name VARCHAR(200) NOT NULL,              -- 站点名称
    type VARCHAR(50),                        -- 类型：牧场/养殖场/屠宰场
    province VARCHAR(50),                    -- 省份
    city VARCHAR(50),                        -- 城市
    district VARCHAR(50),                    -- 区县
    address TEXT,                            -- 详细地址
    lat DECIMAL(10, 8),                      -- 纬度
    lng DECIMAL(11, 8),                      -- 经度
    contact_name VARCHAR(100),               -- 联系人
    contact_phone VARCHAR(20),               -- 联系电话
    status VARCHAR(20) DEFAULT 'active',     -- 状态
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. 监测数据表 (monitoring_data)
```sql
CREATE TABLE monitoring_data (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES monitoring_sites(id),
    device_id VARCHAR(100),                  -- 设备ID
    sample_type VARCHAR(50),                 -- 样本类型：气溶胶/血液/组织
    disease_type VARCHAR(50),                -- 疫病类型
    temperature DECIMAL(5, 2),               -- 温度
    humidity DECIMAL(5, 2),                  -- 湿度
    ph_value DECIMAL(4, 2),                  -- pH值
    detection_result VARCHAR(20),            -- 检测结果：positive/negative/suspect
    confidence DECIMAL(5, 4),                -- 置信度
    raw_data JSONB,                          -- 原始数据
    ai_analysis JSONB,                       -- AI分析结果
    status VARCHAR(20) DEFAULT 'normal',     -- 状态
    detected_at TIMESTAMP,                   -- 检测时间
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. 预警记录表 (alerts)
```sql
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES monitoring_sites(id),
    data_id INTEGER REFERENCES monitoring_data(id),
    alert_type VARCHAR(50),                  -- 预警类型
    severity VARCHAR(20),                    -- 严重程度：low/medium/high/critical
    title VARCHAR(500),                      -- 标题
    description TEXT,                        -- 描述
    status VARCHAR(20) DEFAULT 'open',       -- 状态
    assigned_to INTEGER,                     -- 分配给
    resolved_at TIMESTAMP,                   -- 解决时间
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. AI Agent会话表 (agent_conversations)
```sql
CREATE TABLE agent_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    session_id VARCHAR(100) UNIQUE,          -- 会话ID
    agent_type VARCHAR(50),                  -- Agent类型
    messages JSONB,                          -- 消息记录
    context JSONB,                           -- 上下文
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. 报告表 (reports)
```sql
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    report_type VARCHAR(50),                 -- daily/weekly/monthly/industry
    content TEXT,                            -- 报告内容
    summary TEXT,                            -- 摘要
    data_range_start DATE,                   -- 数据起始日期
    data_range_end DATE,                     -- 数据结束日期
    ai_generated BOOLEAN DEFAULT false,      -- 是否AI生成
    generated_by VARCHAR(50),                -- 生成者
    file_url VARCHAR(500),                   -- 文件地址
    view_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. 用户表 (users)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(200) UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255),              -- 密码哈希
    role VARCHAR(20) DEFAULT 'operator',     -- 角色
    department VARCHAR(100),                 -- 部门
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔌 API设计

### 认证相关
```
POST /api/auth/login          # 登录
POST /api/auth/logout         # 退出
POST /api/auth/refresh        # 刷新Token
GET  /api/auth/me             # 获取当前用户
```

### 监测站点
```
GET    /api/sites                    # 获取站点列表
GET    /api/sites/:id                # 获取站点详情
POST   /api/sites                    # 创建站点
PUT    /api/sites/:id                # 更新站点
DELETE /api/sites/:id                # 删除站点
GET    /api/sites/:id/data           # 获取站点监测数据
GET    /api/sites/nearby             # 附近站点搜索
```

### 监测数据
```
GET  /api/monitoring/data            # 获取监测数据
GET  /api/monitoring/data/:id        # 获取数据详情
POST /api/monitoring/data            # 上报数据（设备）
GET  /api/monitoring/stats           # 统计数据
GET  /api/monitoring/heatmap         # 热力图数据
GET  /api/monitoring/trends          # 趋势数据
```

### AI Agent
```
POST /api/agents/chat                # 开始/继续对话
GET  /api/agents/sessions            # 获取会话列表
GET  /api/agents/sessions/:id        # 获取会话详情
POST /api/agents/analyze             # 数据分析
POST /api/agents/generate-report     # 生成报告
```

### 预警
```
GET    /api/alerts                   # 获取预警列表
GET    /api/alerts/:id               # 获取预警详情
PUT    /api/alerts/:id/acknowledge   # 确认预警
PUT    /api/alerts/:id/resolve       # 解决预警
GET    /api/alerts/stats             # 预警统计
POST   /api/alerts/subscribe         # 订阅告警
```

### 报告
```
GET    /api/reports                  # 获取报告列表
GET    /api/reports/:id              # 获取报告详情
POST   /api/reports                  # 生成报告
GET    /api/reports/:id/download     # 下载报告
DELETE /api/reports/:id              # 删除报告
```

## 🛠️ 技术栈

### 后端
- **语言**: Node.js (TypeScript) / Python (FastAPI)
- **框架**: Fastify / Express / FastAPI
- **数据库**: PostgreSQL 15 + PostGIS (地理扩展)
- **缓存**: Redis 7
- **时序数据库**: InfluxDB 2.x
- **消息队列**: RabbitMQ / Apache Kafka
- **搜索引擎**: Elasticsearch 8.x
- **文件存储**: MinIO (S3兼容)

### 前端
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design / shadcn/ui
- **状态管理**: Zustand / Redux Toolkit
- **图表**: ECharts / D3.js
- **地图**: 高德地图 / Leaflet

### DevOps
- **容器**: Docker + Docker Compose
- **编排**: Kubernetes (生产环境)
- **CI/CD**: GitHub Actions
- **监控**: Prometheus + Grafana
- **日志**: ELK Stack

## 📦 部署架构

### 开发环境 (Docker Compose)
```yaml
# docker-compose.yml 见 backend/docker-compose.yml
services:
  - postgres
  - redis
  - influxdb
  - backend-api
  - frontend
  - nginx
```

### 生产环境 (K8s)
```yaml
# kubernetes/ 目录包含所有部署配置
- namespace.yaml
- configmap.yaml
- secret.yaml
- postgres-deployment.yaml
- redis-deployment.yaml
- backend-deployment.yaml
- frontend-deployment.yaml
- ingress.yaml
```

## 🔒 安全设计

### 1. 认证授权
- JWT Token + Refresh Token
- RBAC 权限模型
- API 速率限制

### 2. 数据安全
- 敏感数据加密存储
- 传输层 TLS 1.3
- 数据库字段级加密

### 3. 审计日志
- 所有操作记录
- 数据变更追踪
- 异常行为检测

## 📊 核心功能模块

### 1. 实时监测大屏
- WebSocket 实时推送
- 地图热力图
- 数据趋势图表
- 告警滚动显示

### 2. AI Agent 系统
- 4个专门化Agent
- 上下文记忆
- 多轮对话
- 任务调度

### 3. 自动报告生成
- 定时任务 (Cron)
- AI 内容生成
- 数据自动汇总
- PDF/Excel 导出

### 4. 智能预警
- 规则引擎
- AI 异常检测
- 多渠道通知 (短信/邮件/微信)
- 预警升级机制

## 🚀 实施路线

### Phase 1: 基础框架 (1周)
- [ ] 搭建后端项目结构
- [ ] 配置数据库 + 迁移
- [ ] 基础API + 认证
- [ ] Docker Compose 环境

### Phase 2: 核心功能 (2周)
- [ ] 监测数据API
- [ ] 实时数据推送 (WebSocket)
- [ ] 预警系统
- [ ] 基础管理后台

### Phase 3: AI能力 (2周)
- [ ] AI Agent服务
- [ ] 报告生成系统
- [ ] 数据分析API
- [ ] 智能推荐

### Phase 4: 完善优化 (1周)
- [ ] 前端重构 (React)
- [ ] 性能优化
- [ ] 安全加固
- [ ] 监控告警

---

**下一步：开始实现 Phase 1 基础框架！**
