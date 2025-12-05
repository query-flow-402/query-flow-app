export type QueryType = 'market' | 'price' | 'news' | 'portfolio' | 'social'

export interface QueryRequest {
  type: QueryType
  params: Record<string, any>
  requester?: string
}

export interface QueryResponse {
  queryId: string
  type: QueryType
  result: any
  tokensUsed: number
  price: number
  timestamp: string
}

export interface AgentIdentity {
  agentId: string
  name: string
  address: string
  reputationScore: number
}
