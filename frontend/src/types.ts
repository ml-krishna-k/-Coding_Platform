export type EmotionScores = {
  happy: number;
  happiness?: number;
  sad: number;
  sadness?: number;
  angry: number;
  anger?: number;
  fear: number;
  surprise: number;
  neutral: number;
  disgust: number;
  [key: string]: number | undefined;
};

export type EmotionAnalysis = {
  emotions: {
    happiness: number;
    neutral: number;
    surprise: number;
    anger: number;
  };
  valence: string;
  engagement_score: number;
  all_scores: EmotionScores;
};

export type AnalysisResult = {
  status: 'ok' | 'no_user' | 'mobile_detected';
  analysis: EmotionAnalysis | null;
  debug_image: string | null;
};

export type AffectState = {
  stress: number;
  bored: number;
  confused: number;
  confident: number;
  mode: 'neutral' | 'angry_frustrated' | 'confused' | 'focused' | 'tired' | 'calm_exploratory';
};
