export interface SWOTItem {
  description: string;
  impact?: 'low' | 'medium' | 'high';
}

export interface SWOTAnalysis {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  score: {
    internal: number;
    external: number;
    overall: number;
  };
} 