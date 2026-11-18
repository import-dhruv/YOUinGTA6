export const TRAITS = [
  "ambition",
  "confidence",
  "risk_appetite",
  "humor",
  "independence",
  "rebelliousness",
  "creativity",
  "social_energy",
  "entrepreneurial",
  "strategic_thinking",
  "loyalty",
  "adaptability",
  "impulsiveness",
  "expressiveness",
] as const;

export type Trait = (typeof TRAITS)[number];

export const TRAIT_LABELS: Record<Trait, string> = {
  ambition: "Ambition",
  confidence: "Confidence",
  risk_appetite: "Risk appetite",
  humor: "Humor",
  independence: "Independence",
  rebelliousness: "Rebelliousness",
  creativity: "Creativity",
  social_energy: "Social energy",
  entrepreneurial: "Entrepreneurial",
  strategic_thinking: "Strategic thinking",
  loyalty: "Loyalty",
  adaptability: "Adaptability",
  impulsiveness: "Impulsiveness",
  expressiveness: "Expressiveness",
};

export const TRAIT_EXPLANATIONS: Record<Trait, string> = {
  ambition: "Goal and achievement vocabulary (e.g. goals, build, win, grind) plus references to plans and progress.",
  confidence: "Assertive, decisive phrasing and first-person certainty markers.",
  risk_appetite: "Adventure, gamble and risk-related vocabulary plus bold, decisive language.",
  humor: "Laughter markers, jokes, memes and playful punctuation patterns.",
  independence: "Autonomy vocabulary such as solo, own, myself and independence.",
  rebelliousness: "Anti-establishment and rule-breaking expressions and oppositional language.",
  creativity: "Vocabulary diversity plus creative and artistic vocabulary.",
  social_energy: "Interaction markers (replies, mentions, questions) and social vocabulary.",
  entrepreneurial: "Business, money and startup-related vocabulary and hustle language.",
  strategic_thinking: "Planning, analysis and long-term vocabulary plus deliberate structure.",
  loyalty: "Expressions of loyalty, support and commitment to people or teams.",
  adaptability: "Topic diversity and openness/change vocabulary.",
  impulsiveness: "Urgency, spontaneity and spontaneous-action vocabulary plus rapid-fire punctuation.",
  expressiveness: "Caps, exclamation marks, emoji and descriptive language.",
};

export interface EvidenceItem {
  text: string;
  matched_terms: string[];
}

export interface FeatureResult {
  trait: string;
  label: string;
  raw_count: number;
  normalized_score: number;
  posts_contributing: number;
  confidence: number;
  explanation: string;
  evidence: EvidenceItem[];
}

export interface TraitMatch {
  trait: string;
  label: string;
  user_score: number;
  character_score: number;
  difference: number;
  shared_strength: number;
}

export interface CharacterMatch {
  character_id: string;
  name: string;
  image: string;
  accent: string;
  tagline: string;
  canonical_bio: string;
  interpretation_note: string;
  match_score: number;
  cosine_similarity: number;
  matching_traits: TraitMatch[];
  biggest_difference: TraitMatch | null;
}

export interface ProfileInfo {
  username: string;
  display_name: string;
  profile_image_url: string;
  bio: string;
  post_count_analyzed: number;
  source: string;
  available: boolean;
  notice: string | null;
  demo: boolean;
}

export interface PersonalityResult {
  vector: Record<string, number>;
  features: Record<string, FeatureResult>;
  overall_confidence: number;
  low_confidence: boolean;
  warning: string | null;
  posts_analyzed: number;
  data_source: string;
}

export interface AnalyzeResponse {
  profile: ProfileInfo;
  personality: PersonalityResult;
  primary: CharacterMatch;
  runners_up: CharacterMatch[];
  ranking: CharacterMatch[];
  reasons: string[];
  analysis_id: string;
  generated_at: string;
}

export interface DemoAccount {
  handle: string;
  display_name: string;
  description: string;
  archetype: string;
  profile_image: string;
}

export interface StageEvent {
  stage: string;
  progress: number;
  message: string;
}
