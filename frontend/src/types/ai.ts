export interface AiImproveRequest {
  text: string;
  context?: string;
  language?: string;
}

export interface AiImproveResponse {
  improvedText: string;
  summary: string;
  highlights: string[];
}
