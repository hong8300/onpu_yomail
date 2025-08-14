export type Clef = 'treble' | 'bass';
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Note {
  name: NoteName;
  octave: number; // 1-5
  clef: Clef;
  position: NotePosition;
}

export interface NotePosition {
  y: number; // Y position on staff (0 = top line)
  ledgerLines?: number; // Number of ledger lines needed
  ledgerLineAbove?: boolean; // true if ledger lines are above staff
}

export interface SessionSettings {
  totalQuestions: number; // 10-100
  noteRange: {
    min: string; // e.g., "C2"
    max: string; // e.g., "C4"
  };
  difficulty: Difficulty;
  clef: Clef | 'both';
}

export interface Question {
  id: string;
  note: Note;
  userAnswer?: string;
  isCorrect?: boolean;
  responseTime?: number;
  timestamp: Date;
}

export interface Session {
  id: string;
  startTime: Date;
  endTime?: Date;
  settings: SessionSettings;
  questions: Question[];
  currentQuestionIndex: number;
  results?: SessionResult;
}

export interface SessionResult {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number; // percentage
  totalTime: number; // milliseconds
  averageResponseTime: number; // milliseconds
  problemNotes: NoteStatistic[];
  inputMethodStats: {
    midi: number;
    keyboard: number;
    mouse: number;
  };
}

export interface NoteStatistic {
  note: string; // e.g., "C4"
  clef: Clef;
  attempts: number;
  correct: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface LearningHistory {
  sessions: Session[];
  overallStats: OverallStatistics;
  lastUpdated: Date;
}

export interface OverallStatistics {
  totalSessions: number;
  totalQuestions: number;
  totalCorrectAnswers: number;
  overallAccuracy: number;
  totalPracticeTime: number; // milliseconds
  favoriteClef: Clef;
  strongNotes: string[]; // Note names with high accuracy
  weakNotes: string[]; // Note names that need practice
  streakDays: number;
  lastPracticeDate: Date | null;
}