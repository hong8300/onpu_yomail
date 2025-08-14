import { Clef, Difficulty } from './types';

export interface PracticeSettings {
  totalQuestions: number; // 10-100
  noteRange: {
    min: string; // e.g., "C2"
    max: string; // e.g., "C4"
  };
  difficulty: Difficulty;
  enableMidi: boolean;
  enableMouse: boolean;
  autoAdvance: boolean;
  autoAdvanceDelay: number; // milliseconds
  enableAccidentals: boolean; // シャープ・フラット有効化
}

export interface AppSettings {
  practice: PracticeSettings;
  display: {
    theme: 'light' | 'dark' | 'system';
    staffSize: 'small' | 'medium' | 'large';
    showDebugInfo: boolean;
  };
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  practice: {
    totalQuestions: 12,
    noteRange: {
      min: 'C3',
      max: 'C5'
    },
    difficulty: 'medium',
    enableMidi: true,
    enableMouse: true,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    enableAccidentals: false // デフォルトは無効
  },
  display: {
    theme: 'system',
    staffSize: 'medium',
    showDebugInfo: false
  }
};

// Question count options
export const QUESTION_COUNT_OPTIONS = [
  { value: 10, label: '10問' },
  { value: 12, label: '12問' },
  { value: 20, label: '20問' },
  { value: 30, label: '30問' },
  { value: 40, label: '40問' },
  { value: 50, label: '50問' },
  { value: 60, label: '60問' },
  { value: 70, label: '70問' },
  { value: 80, label: '80問' },
  { value: 90, label: '90問' },
  { value: 100, label: '100問' }
];

// Note range presets
export const NOTE_RANGE_PRESETS = {
  beginner: { min: 'C4', max: 'C5', label: '初心者 (C4-C5)' },
  intermediate: { min: 'C3', max: 'C6', label: '中級 (C3-C6)' },
  custom: { min: 'C3', max: 'C5', label: 'カスタム' }
};

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  { value: 'easy' as Difficulty, label: '簡単', description: '基本的な音符のみ' },
  { value: 'medium' as Difficulty, label: '普通', description: '標準的な練習' },
  { value: 'hard' as Difficulty, label: '難しい', description: '広い音域、高速出題' }
];

// Staff size options
export const STAFF_SIZE_OPTIONS = [
  { value: 'small', label: '小', description: 'コンパクト表示' },
  { value: 'medium', label: '中', description: '標準サイズ' },
  { value: 'large', label: '大', description: '大きく見やすい' }
];

// Theme options
export const THEME_OPTIONS = [
  { value: 'light', label: 'ライト', description: '明るいテーマ' },
  { value: 'dark', label: 'ダーク', description: '暗いテーマ' },
  { value: 'system', label: 'システム', description: 'OSの設定に従う' }
];