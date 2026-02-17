/**
 * AI Agent 类型定义
 * 北京畜牧兽医研究所 - 智能疫病监测预警平台
 */

export interface AgentConfig {
  id: string;
  name: string;
  title: string;
  avatar: string;
  role: string;
  personality: string;
  expertise: string[];
  systemPrompt: string;
  greeting: string;
  color: string;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  content: string;
  role: 'user' | 'agent' | 'system';
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    latency?: number;
    sources?: string[];
  };
}

export interface AgentConversation {
  id: string;
  userId: string;
  agentId: string;
  messages: AgentMessage[];
  context: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationContext {
  topic?: string;
  siteId?: string;
  monitoringData?: any;
  alertInfo?: any;
  previousSummaries?: string[];
}

export interface AIRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  latency: number;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  metadata?: {
    model?: string;
    tokens?: number;
  };
}
