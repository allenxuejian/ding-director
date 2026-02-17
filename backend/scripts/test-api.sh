#!/bin/bash
# API 测试脚本

BASE_URL="http://localhost:3000/api"
TOKEN=""

echo "🧪 丁主任 API 测试脚本"
echo "====================="
echo ""

# 1. 健康检查
echo "1️⃣ 测试健康检查..."
curl -s $BASE_URL/../health | jq .
echo ""

# 2. 登录
echo "2️⃣ 测试登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')

echo $LOGIN_RESPONSE | jq .
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token: ${TOKEN:0:20}..."
echo ""

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，请检查数据库种子数据是否正确导入"
  exit 1
fi

# 3. 获取站点列表
echo "3️⃣ 获取站点列表..."
curl -s -X GET "$BASE_URL/sites" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
echo ""

# 4. 获取站点统计
echo "4️⃣ 获取站点统计..."
curl -s -X GET "$BASE_URL/sites/stats/overview" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 5. 获取监测数据
echo "5️⃣ 获取监测数据..."
curl -s -X GET "$BASE_URL/monitoring/data" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
echo ""

# 6. 获取监测统计
echo "6️⃣ 获取监测统计..."
curl -s -X GET "$BASE_URL/monitoring/stats?days=7" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.totalCount'
echo ""

# 7. 获取预警列表
echo "7️⃣ 获取预警列表..."
curl -s -X GET "$BASE_URL/alerts" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
echo ""

# 8. 获取报告列表
echo "8️⃣ 获取报告列表..."
curl -s -X GET "$BASE_URL/reports" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
echo ""

# 9. AI Agent 对话测试
echo "9️⃣ 测试 AI Agent 对话..."
curl -s -X POST "$BASE_URL/agents/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "ding1",
    "message": "北京顺义监测站最近有什么异常吗？"
  }' | jq '.response'
echo ""

echo "✅ 所有测试完成！"
