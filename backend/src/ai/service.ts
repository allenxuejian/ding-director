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
