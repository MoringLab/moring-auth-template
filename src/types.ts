
export type Language = 'en' | 'ko';

export interface ProgramDetails {
  name: string;
  duration: string;
  cost: number;
  provider: string;
  services: string;
  notes: string;
}

export interface ReliabilityReport {
  score: number;
  verdict: 'Safe' | 'Caution' | 'High Risk';
  included: string[];
  excluded: string[];
  hiddenCosts: string[];
  redFlags: string[];
  summary: string;
}

export interface ChecklistItem {
  id: string;
  category: 'Documents' | 'Health' | 'Money' | 'Packing' | 'Study';
  text: string;
  checked: boolean;
}

// Updated Diagnostic Types
export type QuestionType = 'scale' | 'choice' | 'text';

export interface DiagnosticQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[]; // For 'choice' type
}

export interface DiagnosticAnswer {
  questionId: number;
  questionText: string;
  answer: string | number;
}

export interface DiagnosticResult {
  category: string;
  score: number;
  feedback: string;
  tips: string[];
}

export interface BudgetData {
  programFee: number;
  flight: number;
  pocketMoney: number;
  insurance: number;
  shopping: number;
  emergency: number;
}

// --- SIMULATOR & CHARACTER TYPES ---

export interface Character {
  id: string;
  name: string;
  age: number;
  job: string;
  personality: string; // e.g., "Strict", "Friendly", "Shy"
  tone: string; // e.g., "Formal", "Slang-heavy"
  region: string; // e.g., "London", "Texas", "Sydney"
  avatarId: string; // For avatar generation
  customAvatar?: string; // Base64 string for custom uploaded avatar
  bio: string;
}

export interface SimulationScenario {
  id: string;
  title: string;
  situation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  // Scenarios might not enforce a role if we select a character,
  // but we keep 'defaultRole' for context
  defaultRole?: string;
}

export interface SimulationTurn {
  id: string; // Added ID for selection
  speaker: 'ai' | 'user';
  text: string;
  timestamp: number;
}

// --- QUIZ TYPES ---

export type QuizDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
export type QuizType = 'Vocabulary' | 'Sentence';

export interface QuizQuestion {
  id: number;
  question: string; // The source text
  correctAnswer: string; // The target translation (or close to it)
  explanation: string;
  options?: string[]; // If we do multiple choice, otherwise text input
}

// ---

export interface RoutineItem {
  week: number;
  day: number;
  morning: string;
  school: string;
  evening: string;
  focus: string;
}

export interface Phrase {
  text: string;
  translation: string;
  note?: string;
}

export enum AppRoute {
  HOME = '/',
  RELIABILITY = '/reliability',
  DIAGNOSTIC = '/diagnostic',
  CHECKLIST = '/checklist',
  TRAINER = '/trainer',
  BUDGET = '/budget',
  SIMULATOR = '/simulator',
  ROUTINE = '/routine',
  QUIZ = '/quiz',
  AUTH_CALLBACK = '/auth/callback',
}
