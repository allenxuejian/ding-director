# 北京畜牧兽医研究所 - 智能疫病监测预警平台

## 项目概述
基于人兽共患病监测预警的 AI Agent 平台

## 核心功能
- 疫病监测预警机器人硬件联动
- 行业资讯自动爬取与分析
- 知识星球（行业今日头条）
- 投行研报自动生成

## 目标行业
- 疫病疾控行业（核心）
- 农业行业（扩展）

## 在线访问
https://allenxuejian.github.io/ding-director/

## 本地开发
```bash
cd 北京畜牧兽医研究所-project
python3 -m http.server 8080
# 访问 http://localhost:8080
```

## 项目结构
- `index.html` - 首页（监测仪表盘）
- `chat.html` - 智能问答（多Agent协作）
- `backend/` - 后端服务（Fastify + PostgreSQL）
- `memory/` - 开发日志
- `需求文档/` - 项目方案与需求
- `行业数据/` - 数据库与数据资源

## AI Agent 团队
1. **采样专家·丁一** - 气溶胶采样分析
2. **检测分析师·丁二** - 微流控检测分析
3. **情报专员·丁三** - 全球资讯追踪
4. **研报助手·丁四** - 自动研报生成

## 技术栈
### 前端
- HTML5 + Tailwind CSS
- Lucide Icons
- GitHub Pages 部署

### 后端
- Node.js + TypeScript
- Fastify 框架
- PostgreSQL + Sequelize
- Redis 缓存
- InfluxDB 时序数据库

## 开发阶段

### Phase 1: 基础框架 ✅
- [x] 数据库设计
- [x] RESTful API 实现
- [x] Docker Compose 配置
- [x] 用户认证系统

### Phase 2: AI Agent 集成 🚧
- [ ] OpenClaw/Claude API 集成
- [ ] Agent 人格化配置
- [ ] 多 Agent 协作逻辑
- [ ] 流式响应支持

### Phase 3: 实时监测 ⏳
- [ ] WebSocket 实时数据
- [ ] 告警通知系统
- [ ] 数据可视化

### Phase 4: 高级功能 ⏳
- [ ] 知识星球模块
- [ ] 研报自动生成
- [ ] 竞品分析系统

## 更新日志

### 2026-02-17
- ✅ 项目更名为"北京畜牧兽医研究所"
- 🚧 Phase 2 AI Agent 集成开发中

### 2026-02-16
- ✅ 创建项目框架
- ✅ 开发首页仪表盘
- ✅ 开发 Chat 交互页
- ✅ 实现 4 个 AI Agent 角色
- ✅ 添加自主探索模式
- ✅ Phase 1 后端基础框架完成

---
Powered by OpenClaw AI
