# 北京畜牧兽医研究所后端 - 常用脚本

## 数据库操作

### 初始化数据库
```bash
# 创建数据库
createdb ding_director

# 运行种子数据（插入测试数据）
npx ts-node scripts/seed.ts
```

### 重置数据库
```bash
# 清空所有数据并重新插入
npx ts-node scripts/reset-db.ts
```

## 开发命令

### 启动开发服务器
```bash
npm run dev
```

### 编译 TypeScript
```bash
npm run build
```

### 生产运行
```bash
npm start
```

## Docker 部署

### 开发环境
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down
```

### 生产部署
```bash
# 构建镜像
docker build -t ding-director-backend .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  -e JWT_SECRET=your-secret \
  --name ding-backend \
  ding-director-backend
```

## API 测试

### 使用 curl 测试

```bash
# 1. 登录获取 token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# 2. 获取站点列表
curl -X GET http://localhost:3000/api/sites \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. 上报监测数据
curl -X POST http://localhost:3000/api/monitoring/data \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": 1,
    "sampleType": "气溶胶",
    "diseaseType": "非洲猪瘟",
    "detectionResult": "negative",
    "detectedAt": "2026-02-16T10:00:00Z"
  }'
```

### 使用 httpie

```bash
# 安装 httpie
pip install httpie

# 登录
http POST localhost:3000/api/auth/login username=admin password=admin123

# 获取站点列表
http GET localhost:3000/api/sites Authorization:"Bearer TOKEN"

# 创建站点
http POST localhost:3000/api/sites \
  Authorization:"Bearer TOKEN" \
  siteCode=TEST-001 \
  name=测试站点 \
  province=北京市
```

## 性能测试

### 使用 wrk
```bash
# 安装 wrk
brew install wrk

# 测试 API 性能
wrk -t12 -c400 -d30s http://localhost:3000/health
```

### 使用 autocannon
```bash
# 安装
npm install -g autocannon

# 测试
autocannon -c 100 -d 30 http://localhost:3000/api/sites
```

## 日志查看

```bash
# 实时查看日志
tail -f /tmp/openclaw/openclaw-2026-02-16.log

# 查看错误日志
docker-compose logs backend | grep ERROR
```

## 备份与恢复

### 数据库备份
```bash
# PostgreSQL 备份
pg_dump -h localhost -U postgres ding_director > backup.sql

# 压缩备份
pg_dump -h localhost -U postgres ding_director | gzip > backup.sql.gz
```

### 数据库恢复
```bash
# 恢复备份
createdb ding_director_restored
pg_restore -h localhost -U postgres -d ding_director_restored backup.sql
```
