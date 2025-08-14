'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  LearningHistory, 
  Session, 
  SessionResult, 
  OverallStatistics, 
  NoteStatistic,
  Question 
} from '@/lib/types';

const HISTORY_STORAGE_KEY = 'onpu-learning-history';

const DEFAULT_HISTORY: LearningHistory = {
  sessions: [],
  overallStats: {
    totalSessions: 0,
    totalQuestions: 0,
    totalCorrectAnswers: 0,
    overallAccuracy: 0,
    totalPracticeTime: 0,
    favoriteClef: 'treble',
    strongNotes: [],
    weakNotes: [],
    streakDays: 0,
    lastPracticeDate: null
  },
  lastUpdated: new Date()
};

export function useHistory() {
  const [history, setHistory] = useState<LearningHistory>(DEFAULT_HISTORY);
  const [isLoading, setIsLoading] = useState(true);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        // Convert date strings back to Date objects
        const processedHistory: LearningHistory = {
          ...parsed,
          sessions: parsed.sessions.map((session: any) => ({
            ...session,
            startTime: new Date(session.startTime),
            endTime: session.endTime ? new Date(session.endTime) : undefined,
            questions: session.questions.map((q: any) => ({
              ...q,
              timestamp: new Date(q.timestamp)
            }))
          })),
          overallStats: {
            ...parsed.overallStats,
            lastPracticeDate: parsed.overallStats.lastPracticeDate 
              ? new Date(parsed.overallStats.lastPracticeDate) 
              : null
          },
          lastUpdated: new Date(parsed.lastUpdated)
        };
        setHistory(processedHistory);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistory(DEFAULT_HISTORY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: LearningHistory) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error('Failed to save history:', error);
      throw error;
    }
  }, []);

  // Calculate session result
  const calculateSessionResult = useCallback((session: Session): SessionResult => {
    const completedQuestions = session.questions.filter(q => q.userAnswer !== undefined);
    const correctAnswers = completedQuestions.filter(q => q.isCorrect).length;
    const totalTime = session.endTime && session.startTime 
      ? session.endTime.getTime() - session.startTime.getTime() 
      : 0;

    // Calculate response times
    const responseTimes = completedQuestions
      .filter(q => q.responseTime !== undefined)
      .map(q => q.responseTime!);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Calculate note statistics
    const noteStats: Record<string, NoteStatistic> = {};
    completedQuestions.forEach(question => {
      const noteKey = `${question.note.name}${question.note.octave}`;
      if (!noteStats[noteKey]) {
        noteStats[noteKey] = {
          note: noteKey,
          clef: question.note.clef,
          attempts: 0,
          correct: 0,
          averageResponseTime: 0,
          errorRate: 0
        };
      }
      noteStats[noteKey].attempts++;
      if (question.isCorrect) {
        noteStats[noteKey].correct++;
      }
      if (question.responseTime) {
        noteStats[noteKey].averageResponseTime = 
          (noteStats[noteKey].averageResponseTime + question.responseTime) / 2;
      }
    });

    // Calculate error rates and identify problem notes
    const problemNotes = Object.values(noteStats)
      .map(stat => ({
        ...stat,
        errorRate: (stat.attempts - stat.correct) / stat.attempts
      }))
      .filter(stat => stat.errorRate > 0.3) // 30% error rate threshold
      .sort((a, b) => b.errorRate - a.errorRate);

    // Count input methods (placeholder - would need to track this in actual implementation)
    const inputMethodStats = {
      midi: 0,
      keyboard: 0,
      mouse: completedQuestions.length // Default to mouse for now
    };

    return {
      totalQuestions: completedQuestions.length,
      correctAnswers,
      accuracy: completedQuestions.length > 0 ? (correctAnswers / completedQuestions.length) * 100 : 0,
      totalTime,
      averageResponseTime,
      problemNotes,
      inputMethodStats
    };
  }, []);

  // Calculate overall statistics
  const calculateOverallStats = useCallback((sessions: Session[]): OverallStatistics => {
    if (sessions.length === 0) {
      return DEFAULT_HISTORY.overallStats;
    }

    const completedSessions = sessions.filter(s => s.results);
    const totalQuestions = completedSessions.reduce((sum, s) => sum + (s.results?.totalQuestions || 0), 0);
    const totalCorrectAnswers = completedSessions.reduce((sum, s) => sum + (s.results?.correctAnswers || 0), 0);
    const totalPracticeTime = completedSessions.reduce((sum, s) => sum + (s.results?.totalTime || 0), 0);

    // Calculate favorite clef
    const clefCounts = completedSessions.reduce((counts, session) => {
      const clef = session.settings.clef === 'both' ? 'treble' : session.settings.clef;
      counts[clef] = (counts[clef] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    const favoriteClef = Object.entries(clefCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['treble', 0])[0] as any;

    // Aggregate note statistics
    const allNoteStats: Record<string, { attempts: number; correct: number; }> = {};
    completedSessions.forEach(session => {
      session.results?.problemNotes.forEach(note => {
        if (!allNoteStats[note.note]) {
          allNoteStats[note.note] = { attempts: 0, correct: 0 };
        }
        allNoteStats[note.note].attempts += note.attempts;
        allNoteStats[note.note].correct += note.correct;
      });
    });

    // Identify strong and weak notes
    const noteAccuracies = Object.entries(allNoteStats).map(([note, stats]) => ({
      note,
      accuracy: stats.attempts > 0 ? stats.correct / stats.attempts : 0,
      attempts: stats.attempts
    }));

    const strongNotes = noteAccuracies
      .filter(n => n.attempts >= 5 && n.accuracy >= 0.9)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5)
      .map(n => n.note);

    const weakNotes = noteAccuracies
      .filter(n => n.attempts >= 3 && n.accuracy < 0.7)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)
      .map(n => n.note);

    // Calculate streak days
    const today = new Date();
    const lastPracticeDate = completedSessions.length > 0 
      ? new Date(Math.max(...completedSessions.map(s => s.startTime.getTime())))
      : null;

    let streakDays = 0;
    if (lastPracticeDate) {
      const daysDiff = Math.floor((today.getTime() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) {
        // Calculate consecutive days (simplified - would need more complex logic for actual streaks)
        streakDays = 1;
      }
    }

    return {
      totalSessions: completedSessions.length,
      totalQuestions,
      totalCorrectAnswers,
      overallAccuracy: totalQuestions > 0 ? (totalCorrectAnswers / totalQuestions) * 100 : 0,
      totalPracticeTime,
      favoriteClef,
      strongNotes,
      weakNotes,
      streakDays,
      lastPracticeDate
    };
  }, []);

  // Add a completed session
  const addSession = useCallback((session: Session) => {
    const sessionWithResult = {
      ...session,
      results: calculateSessionResult(session)
    };

    const newSessions = [...history.sessions, sessionWithResult];
    const newOverallStats = calculateOverallStats(newSessions);
    
    const newHistory: LearningHistory = {
      sessions: newSessions,
      overallStats: newOverallStats,
      lastUpdated: new Date()
    };

    saveHistory(newHistory);
  }, [history.sessions, calculateSessionResult, calculateOverallStats, saveHistory]);

  // Get recent sessions
  const getRecentSessions = useCallback((limit: number = 10) => {
    return history.sessions
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }, [history.sessions]);

  // Get sessions by date range
  const getSessionsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return history.sessions.filter(session => 
      session.startTime >= startDate && session.startTime <= endDate
    );
  }, [history.sessions]);

  // Export history
  const exportHistory = useCallback(() => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `onpu-history-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [history]);

  // Import history
  const importHistory = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const importedHistory = JSON.parse(text);
          
          // Validate structure
          if (!importedHistory.sessions || !importedHistory.overallStats) {
            throw new Error('Invalid history format');
          }
          
          // Process dates
          const processedHistory: LearningHistory = {
            ...importedHistory,
            sessions: importedHistory.sessions.map((session: any) => ({
              ...session,
              startTime: new Date(session.startTime),
              endTime: session.endTime ? new Date(session.endTime) : undefined,
              questions: session.questions.map((q: any) => ({
                ...q,
                timestamp: new Date(q.timestamp)
              }))
            })),
            overallStats: {
              ...importedHistory.overallStats,
              lastPracticeDate: importedHistory.overallStats.lastPracticeDate 
                ? new Date(importedHistory.overallStats.lastPracticeDate) 
                : null
            },
            lastUpdated: new Date()
          };
          
          saveHistory(processedHistory);
          resolve();
        } catch (error) {
          reject(new Error('Failed to import history: Invalid file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [saveHistory]);

  // Clear all history
  const clearHistory = useCallback(() => {
    saveHistory(DEFAULT_HISTORY);
  }, [saveHistory]);

  return {
    history,
    isLoading,
    addSession,
    getRecentSessions,
    getSessionsByDateRange,
    exportHistory,
    importHistory,
    clearHistory
  };
}