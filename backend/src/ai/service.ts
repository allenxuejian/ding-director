/**
 * AI Service - OpenClaw/Claude API 集成
 * 提供流式对话和非流式对话能力
 */

import { AIRequest, AIResponse, StreamChunk, AgentConfig } from '../types/agent';
import { getAgentById } from '../agents/config';

// OpenClaw Gateway 配置
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || '';

/**
 * 构建系统提示词
 */
export function buildSystemPrompt(agentId: string, context?: any): string {
  const agent = getAgentById(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  let prompt = agent.systemPrompt;

  // 添加上下文信息
  if (context) {
    prompt += '\n\n【当前上下文】\n';
    
    if (context.siteId) {
      prompt += `- 监测站点ID: ${context.siteId}\n`;
    }
    
    if (context.monitoringData) {
      prompt += `- 监测数据: ${JSON.stringify(context.monitoringData)}\n`;
    }
    
    if (context.alertInfo) {
      prompt += `- 告警信息: ${JSON.stringify(context.alertInfo)}\n`;
    }
    
    if (context.topic) {
      prompt += `- 当前主题: ${context.topic}\n`;
    }
  }

  // 添加身份标识
  prompt += `\n\n请记住，你是${agent.name}（${agent.title}），用第一人称回复。`;

  return prompt;
}

/**
 * 非流式对话
 */
export async function chatCompletion(
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<AIResponse> {
  const startTime = Date.now();

  // 模拟模式 - 如果没有配置OpenClaw Gateway
  if (!OPENCLAW_GATEWAY_URL || OPENCLAW_GATEWAY_URL === 'http://127.0.0.1:18789') {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userMessage = messages[messages.length - 1]?.content || '';
    const systemPrompt = messages[0]?.content || '';
    
    // 根据Agent类型生成不同的回复
    let content = '';
    if (systemPrompt.includes('采样专家')) {
      content = `作为采样专家，针对您的问题"${userMessage}"，我建议：

1. **采样点位选择**：建议选择通风良好的位置，距离畜禽活动区域3-5米
2. **采样时间**：最佳时间为上午9-11点，此时气溶胶浓度相对稳定
3. **设备参数**：气溶胶采样器流量设置为200L/min，采样时间30分钟
4. **注意事项**：
   - 采样前检查设备密封性
   - 记录环境温湿度数据
   - 采样后立即冷藏保存样本

如需更详细的采样方案，请提供具体的养殖场信息。`;
    } else if (systemPrompt.includes('检测分析师')) {
      content = `根据检测分析，针对您的问题"${userMessage}"，我的分析如下：

**检测数据解读**：
- 当前样本Ct值为28.5，处于阳性临界区域
- 建议进行复检以确认结果
- 扩增曲线呈现典型的S型特征

**质量控制**：
- 阴性对照正常 ✓
- 阳性对照正常 ✓
- 内参基因表达稳定

**后续建议**：
1. 采集更多样本进行验证
2. 扩大监测范围至周边区域
3. 加强生物安全防控措施

预计24小时内可出具正式检测报告。`;
    } else if (systemPrompt.includes('情报专员')) {
      content = `根据最新情报收集，关于"${userMessage}"：

**全球疫情动态**（截至今日）：
- 🇨🇳 国内：农业农村部发布最新监测数据，整体平稳
- 🇺🇸 美国：堪萨斯州发现新型变异株，正在密切监测
- 🇧🇷 巴西：禽流感防控取得阶段性成效

**政策法规**：
- 《动物防疫法实施细则》已于本月正式实施
- 海关总署加强进口畜禽产品检疫力度

**研究进展**：
- 中国农科院团队在非洲猪瘟疫苗研究上取得突破
- 新型快速检测试剂盒进入临床试验阶段

建议持续关注WHO和OIE的每周疫情通报。`;
    } else {
      content = `感谢您的问题"${userMessage}"！

作为北京畜牧兽医研究所的智能助手，我已收到您的询问并正在进行分析。

**当前能力**：
- ✅ 实时监测数据查询
- ✅ 全球疫情资讯追踪
- ✅ 专业检测报告解读
- ✅ 行业研报自动生成

**建议**：
您可以点击右侧的Agent卡片，选择特定的专家进行咨询：
- 🔬 丁一（采样专家）- 气溶胶采样相关问题
- 🧪 丁二（检测分析师）- 检测数据分析
- 🌐 丁三（情报专员）- 行业资讯和政策
- 📊 丁四（研报助手）- 研报生成和决策建议

请问有什么具体的疫病监测问题需要帮助？`;
    }
    
    return {
      content,
      model: 'kimi-coding/k2p5',
      tokens: {
        prompt: messages.reduce((acc, m) => acc + m.content.length, 0),
        completion: content.length,
        total: messages.reduce((acc, m) => acc + m.content.length, 0) + content.length
      },
      latency: Date.now() - startTime
    };
  }

  try {
    const response = await fetch(`${OPENCLAW_GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OPENCLAW_API_KEY && { 'Authorization': `Bearer ${OPENCLAW_API_KEY}` })
      },
      body: JSON.stringify({
        model: options.model || 'anthropic/claude-sonnet-4-5-20250929',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI request failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    return {
      content: data.choices[0].message.content,
      model: data.model || 'unknown',
      tokens: {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0
      },
      latency
    };
  } catch (error) {
    console.error('AI chat completion error:', error);
    throw error;
  }
}

/**
 * 流式对话
 */
export async function* streamCompletion(
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): AsyncGenerator<StreamChunk> {
  try {
    const response = await fetch(`${OPENCLAW_GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OPENCLAW_API_KEY && { 'Authorization': `Bearer ${OPENCLAW_API_KEY}` })
      },
      body: JSON.stringify({
        model: options.model || 'anthropic/claude-sonnet-4-5-20250929',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI stream request failed: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        yield { content: '', done: true };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '' || line.startsWith(':')) continue;
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }

          try {
            const chunk = JSON.parse(data);
            const content = chunk.choices?.[0]?.delta?.content || '';
            
            if (content) {
              yield {
                content,
                done: false,
                metadata: {
                  model: chunk.model
                }
              };
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error) {
    console.error('AI stream completion error:', error);
    throw error;
  }
}

/**
 * Agent 对话包装器
 */
export async function chatWithAgent(
  agentId: string,
  userMessage: string,
  history: Array<{ role: string; content: string }> = [],
  context?: any
): Promise<AIResponse> {
  const systemPrompt = buildSystemPrompt(agentId, context);
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];

  return chatCompletion(messages);
}

/**
 * Agent 流式对话包装器
 */
export async function* streamWithAgent(
  agentId: string,
  userMessage: string,
  history: Array<{ role: string; content: string }> = [],
  context?: any
): AsyncGenerator<StreamChunk> {
  const systemPrompt = buildSystemPrompt(agentId, context);
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];

  yield* streamCompletion(messages);
}
