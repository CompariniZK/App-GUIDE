// ─── User Profile ────────────────────────────────────────────────────────────
export type UserSituation =
  | 'new_arrival'       // Recem chegado (< 6 meses)
  | 'resident'          // Residente estabelecido
  | 'student'           // Estudante internacional
  | 'worker'            // Trabalhador
  | 'refugee'           // Refugiado / demandeur d'asile
  | 'family'            // Reunificacao familiar
  | 'other';

export type AppLanguage = 'fr' | 'en' | 'pt' | 'es' | 'ar';

export interface UserProfile {
  id: string;
  nationality: string;
  situation: UserSituation;
  language: AppLanguage;
  arrivalYear?: number;
  completedGuides: string[];
  savedGuides: string[];
  createdAt: string;
}

// ─── Guides ──────────────────────────────────────────────────────────────────
export type GuideCategory =
  | 'documents'
  | 'health'
  | 'housing'
  | 'work'
  | 'family'
  | 'finance'
  | 'transport'
  | 'education';

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  officialLink?: string;
  documents?: string[];
  tip?: string;
}

export interface Guide {
  id: string;
  title: string;
  subtitle: string;
  category: GuideCategory;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;     // ex: "2–3 semaines"
  relevantFor: UserSituation[];
  steps: GuideStep[];
  officialSource?: string;
  lastUpdated: string;
}

// ─── Chat / IA ───────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];        // Fontes citadas pela IA
  isLoading?: boolean;
}

// ─── Navigation ──────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Nationality: undefined;
  Situation: { nationality: string };
};

export type MainTabParamList = {
  Home: undefined;
  Guides: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type GuidesStackParamList = {
  GuidesList: undefined;
  GuideDetail: { guideId: string };
};
