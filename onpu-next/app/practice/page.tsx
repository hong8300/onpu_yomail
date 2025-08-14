'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import { PianoKeyboard } from '@/components/music/PianoKeyboard';
import { useMidiContext } from '@/components/providers/MidiProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getAvailableNotes, getRandomNote } from '@/lib/music-data';
import { Note, NoteName, Clef, Session, Question } from '@/lib/types';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  Settings, 
  History,
  Home,
  CheckCircle,
  Clock,
  Target,
  Piano
} from 'lucide-react';

// Dynamic import to avoid SSR issues with Vexflow
const VexflowMultipleNotes = dynamic(
  () => import('@/components/music/VexflowMultipleNotes').then(mod => ({ default: mod.VexflowMultipleNotes })),
  { ssr: false }
);

const NOTE_NAMES: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

type GameState = 'setup' | 'playing' | 'paused' | 'completed';
type InputMethod = 'mouse' | 'midi';

export default function PracticePage() {
  const { settings, isLoading: settingsLoading } = useSettings();
  const { addSession } = useHistory();
  const { isConnected: midiConnected, onNoteOn, removeNoteOnListener } = useMidiContext();
  
  // Hydration対応: クライアントサイドでのみMIDI状態を表示
  const [isClient, setIsClient] = useState(false);

  const [gameState, setGameState] = useState<GameState>('setup');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [completedSession, setCompletedSession] = useState<Session | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<NoteName | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastInputMethod, setLastInputMethod] = useState<InputMethod>('mouse');
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [vexflowDimensions, setVexflowDimensions] = useState({ width: 1400, height: 250 });

  // Audio context for playing notes
  const playNoteSound = useCallback((noteName: NoteName, octave?: number) => {
    try {
      // Create audio context if it doesn't exist
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Calculate frequency based on note name and octave
      // C4 = 261.63 Hz is the reference
      const noteToSemitone: Record<NoteName, number> = {
        'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
      };
      
      const targetOctave = octave || 4; // Default to C4 if no octave specified
      const semitoneFromC4 = (targetOctave - 4) * 12 + noteToSemitone[noteName];
      const frequency = 261.63 * Math.pow(2, semitoneFromC4 / 12);
      
      // Create oscillator
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      // Envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio playback not available:', error);
    }
  }, []);

  // Play buzzer sound for incorrect answers
  const playBuzzerSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Create buzzer sound with low frequency and sawtooth wave
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Low frequency for "buzzer" sound (around 80Hz - deeper sound)
      oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
      oscillator.type = 'sawtooth'; // Harsh sound for incorrect answer
      
      // Short, attention-grabbing envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Buzzer sound not available:', error);
    }
  }, []);

  // Generate notes based on settings
  const generateNotes = useCallback(() => {
    if (!settings) return [];

    const { practice } = settings;
    // 常に両方の音部記号を使用
    const clefs: Clef[] = ['treble', 'bass'];
    
    const allAvailableNotes: Note[] = [];
    clefs.forEach(clef => {
      const clefNotes = getAvailableNotes(clef, practice.noteRange.min, practice.noteRange.max);
      allAvailableNotes.push(...clefNotes);
    });

    const newNotes: Note[] = [];
    let previousNote: Note | undefined;
    
    for (let i = 0; i < practice.totalQuestions; i++) {
      const note = getRandomNote(allAvailableNotes, previousNote);
      newNotes.push(note);
      previousNote = note;
    }
    
    return newNotes;
  }, [settings]);

  // Start new session
  const startSession = useCallback(() => {
    if (!settings) return;

    const newNotes = generateNotes();
    const session: Session = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      settings: {
        ...settings.practice,
        clef: 'both' as const // 常に両方の音部記号を使用
      },
      questions: newNotes.map((note, index) => ({
        id: `question-${index}`,
        note,
        timestamp: new Date()
      })),
      currentQuestionIndex: 0
    };

    setNotes(newNotes);
    setCurrentSession(session);
    setCompletedSession(null); // Clear any previous completed session
    setCurrentNoteIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameState('playing');
    setQuestionStartTime(Date.now());
  }, [settings, generateNotes]);

  // Current note and question
  const currentNote = notes[currentNoteIndex];
  const currentQuestion = currentSession?.questions[currentNoteIndex];

  // Navigation functions
  const nextQuestion = useCallback(() => {
    if (currentNoteIndex < notes.length - 1) {
      setCurrentNoteIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuestionStartTime(Date.now());
    } else {
      // Complete session when reaching the last question
      if (currentSession) {
        const finishedSession: Session = {
          ...currentSession,
          endTime: new Date()
        };
        setCompletedSession(finishedSession);
        addSession(finishedSession);
        setGameState('completed');
      }
    }
  }, [currentNoteIndex, notes.length, currentSession, addSession]);

  const previousQuestion = useCallback(() => {
    if (currentNoteIndex > 0) {
      setCurrentNoteIndex(prev => prev - 1);
      const prevQuestion = currentSession?.questions[currentNoteIndex - 1];
      setSelectedAnswer(prevQuestion?.userAnswer as NoteName || null);
      setShowResult(!!prevQuestion?.userAnswer);
    }
  }, [currentNoteIndex, currentSession]);

  // Complete session handler (currently unused but may be needed for future features)
  // const completeSession = useCallback(() => {
  //   if (!currentSession) return;
  //   
  //   const completedSession: Session = {
  //     ...currentSession,
  //     endTime: new Date()
  //   };
  //   
  //   addSession(completedSession);
  //   setGameState('completed');
  // }, [currentSession, addSession]);

  // Handle answer submission
  const handleNoteClick = useCallback((noteName: NoteName, inputMethod: InputMethod = 'mouse', octave?: number) => {
    if (gameState !== 'playing' || showResult || !currentNote || !currentSession || !currentQuestion) return;
    
    // Play the note sound
    // For button clicks, use the provided octave or default to 4
    if (inputMethod === 'mouse') {
      playNoteSound(noteName, octave || 4);
    }
    
    const responseTime = Date.now() - questionStartTime;
    
    // Check if the answer is correct, including octave if provided
    let isCorrect = noteName === currentNote?.name;
    if (octave !== undefined && currentNote?.octave !== undefined) {
      // If octave is provided, check it matches exactly
      isCorrect = isCorrect && (octave === currentNote.octave);
    }
    
    // Play buzzer sound for incorrect answers
    if (!isCorrect) {
      playBuzzerSound();
    }
    
    setSelectedAnswer(noteName);
    setShowResult(true);
    setLastInputMethod(inputMethod);
    
    // Update question in session
    const updatedQuestion: Question = {
      ...currentQuestion,
      userAnswer: noteName,
      isCorrect,
      responseTime,
      timestamp: new Date()
    };
    
    setCurrentSession(prev => {
      if (!prev) return prev;
      const updatedQuestions = [...prev.questions];
      updatedQuestions[currentNoteIndex] = updatedQuestion;
      return {
        ...prev,
        questions: updatedQuestions
      };
    });
    
    // Auto advance immediately if enabled
    if (settings?.practice.autoAdvance) {
      // Use shorter delay for MIDI input for faster response
      const delay = inputMethod === 'midi' ? 200 : 400;
      setTimeout(() => {
        nextQuestion(); // Use the existing nextQuestion function to avoid duplication
      }, delay);
    }
  }, [gameState, showResult, currentNote, currentSession, currentQuestion, currentNoteIndex, questionStartTime, settings, notes.length, playNoteSound, playBuzzerSound, addSession, nextQuestion]);;

  // MIDI note handler with debounce to prevent duplicate inputs
  const midiProcessingRef = useRef(false);
  
  // Create stable refs for MIDI access
  const gameStateRef = useRef(gameState);
  const showResultRef = useRef(showResult);
  const currentNoteRef = useRef(currentNote);
  const currentSessionRef = useRef(currentSession);
  const currentQuestionRef = useRef(currentQuestion);
  const currentNoteIndexRef = useRef(currentNoteIndex);
  const questionStartTimeRef = useRef(questionStartTime);
  const settingsRef = useRef(settings);
  const notesRef = useRef(notes);
  
  // Update refs when state changes
  useEffect(() => {
    gameStateRef.current = gameState;
    showResultRef.current = showResult;
    currentNoteRef.current = currentNote;
    currentSessionRef.current = currentSession;
    currentQuestionRef.current = currentQuestion;
    currentNoteIndexRef.current = currentNoteIndex;
    questionStartTimeRef.current = questionStartTime;
    settingsRef.current = settings;
    notesRef.current = notes;
  });
  
  const handleMidiNote = useCallback((noteName: NoteName, octave: number) => {
    // Use refs to avoid dependency issues
    if (!midiProcessingRef.current && settingsRef.current?.practice.enableMidi) {
      console.log('MIDI input received:', noteName, 'octave:', octave);
      
      // Check if we should process this input using refs
      if (gameStateRef.current === 'playing' && !showResultRef.current && currentNoteRef.current) {
        midiProcessingRef.current = true;
        console.log('MIDI note processed:', noteName);
        
        // Directly handle the MIDI input without calling handleNoteClick
        const responseTime = Date.now() - questionStartTimeRef.current;
        const isCorrect = noteName === currentNoteRef.current?.name;
        
        // Play buzzer sound for incorrect answers
        if (!isCorrect) {
          playBuzzerSound();
        }
        
        setSelectedAnswer(noteName);
        setShowResult(true);
        setLastInputMethod('midi');
        
        // Play the sound with the correct octave that was pressed
        playNoteSound(noteName, octave);
        
        // Update question in session
        if (currentQuestionRef.current && currentSessionRef.current) {
          const updatedQuestion: Question = {
            ...currentQuestionRef.current,
            userAnswer: noteName,
            isCorrect,
            responseTime,
            timestamp: new Date()
          };
          
          setCurrentSession(prev => {
            if (!prev) return prev;
            const updatedQuestions = [...prev.questions];
            updatedQuestions[currentNoteIndexRef.current] = updatedQuestion;
            return {
              ...prev,
              questions: updatedQuestions
            };
          });
          
          // Auto advance if enabled
          if (settingsRef.current?.practice.autoAdvance) {
            setTimeout(() => {
              // Implement nextQuestion logic directly to avoid dependency
              if (currentNoteIndexRef.current < notesRef.current.length - 1) {
                setCurrentNoteIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setShowResult(false);
                setQuestionStartTime(Date.now());
              } else {
                // Complete session when reaching the last question
                if (currentSessionRef.current) {
                  const finishedSession: Session = {
                    ...currentSessionRef.current,
                    endTime: new Date()
                  };
                  setCompletedSession(finishedSession);
                  addSession(finishedSession);
                  setGameState('completed');
                }
              }
            }, 200); // Shorter delay for MIDI
          }
        }
        
        // Reset flag after a short delay to allow next input
        setTimeout(() => {
          midiProcessingRef.current = false;
        }, 100);
      } else {
        console.log('MIDI input ignored - gameState:', gameStateRef.current, 'showResult:', showResultRef.current);
      }
    }
  }, [playNoteSound, playBuzzerSound, addSession]);
  
  // Reset MIDI processing flag when moving to next question
  useEffect(() => {
    midiProcessingRef.current = false;
  }, [currentNoteIndex]);

  // Set up MIDI callback when playing
  useEffect(() => {
    console.log('MIDI useEffect triggered, gameState:', gameState, 'enableMidi:', settings?.practice.enableMidi);
    if (gameState === 'playing' && settings?.practice.enableMidi) {
      console.log('Setting up MIDI listener');
      onNoteOn(handleMidiNote);
    } else {
      console.log('Removing MIDI listener');
      removeNoteOnListener();
    }
  }, [gameState, settings?.practice.enableMidi, onNoteOn, removeNoteOnListener, handleMidiNote]);


  // クライアントサイドマウント検出
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Handle responsive Vexflow dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      if (width < 640) { // sm breakpoint
        setVexflowDimensions({ width: Math.min(width - 40, 600), height: 180 });
      } else if (width < 768) { // md breakpoint
        setVexflowDimensions({ width: Math.min(width - 80, 900), height: 200 });
      } else if (width < 1024) { // lg breakpoint
        setVexflowDimensions({ width: Math.min(width - 100, 1200), height: 230 });
      } else {
        setVexflowDimensions({ width: 1400, height: 250 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);


  // Calculate session progress
  const progress = useMemo(() => {
    const session = completedSession || currentSession;
    if (!session) return { answered: 0, correct: 0, percentage: 0 };
    
    const answered = session.questions.filter(q => q.userAnswer !== undefined).length;
    const correct = session.questions.filter(q => q.isCorrect).length;
    const percentage = notes.length > 0 ? (answered / notes.length) * 100 : 0;
    
    return { answered, correct, percentage };
  }, [currentSession, completedSession, notes.length]);

  const isCorrect = selectedAnswer === currentNote?.name;

  const getNoteJapaneseName = (name: NoteName) => {
    const names: Record<NoteName, string> = {
      'C': 'ド', 'C#': 'ド#', 'D': 'レ', 'D#': 'レ#', 'E': 'ミ', 'F': 'ファ',
      'F#': 'ファ#', 'G': 'ソ', 'G#': 'ソ#', 'A': 'ラ', 'A#': 'ラ#', 'B': 'シ'
    };
    return names[name];
  };

  const getInputMethodIcon = () => {
    switch (lastInputMethod) {
      case 'midi': return <Piano className="w-4 h-4" />;
      default: return null;
    }
  };

  if (settingsLoading) {
    console.log('Settings still loading, forcing to continue for debugging...');
    // Temporarily skip loading check for debugging
    // return (
    //   <div className="min-h-screen flex items-center justify-center">
    //     <div className="text-center">
    //       <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
    //       <p>設定を読み込み中...</p>
    //     </div>
    //   </div>
    // );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              楽譜学習 - Onpu
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              音符を見て瞬時に音名を答える練習
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* MIDI Connection Status */}
            {isClient && settings?.practice.enableMidi && (
              <Badge variant={midiConnected ? "default" : "secondary"} className="hidden sm:flex">
                <Piano className="w-3 h-3 mr-1" />
                MIDI: {midiConnected ? '接続中' : '未接続'}
              </Badge>
            )}
            
            <ThemeToggle />
            <Button variant="outline" asChild>
              <a href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                設定
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/history">
                <History className="w-4 h-4 mr-2" />
                履歴
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                ホーム
              </Link>
            </Button>
          </div>
        </div>

        {gameState === 'setup' && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-center">練習を開始</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{settings?.practice.totalQuestions}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">問題数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">ト音記号・ヘ音記号</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">音部記号</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {settings?.practice.noteRange.min} - {settings?.practice.noteRange.max}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">音域</p>
                  </div>
                </div>
                
                <Button onClick={startSession} size="lg" className="px-8">
                  <Play className="w-5 h-5 mr-2" />
                  練習開始
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {gameState === 'playing' && (
          <>
            {/* Progress and Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-3">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        問題 {currentNoteIndex + 1} / {notes.length}
                      </span>
                      <Badge variant="secondary">
                        {progress.percentage.toFixed(0)}% 完了
                      </Badge>
                    </div>
                    <Progress value={progress.percentage} className="w-full" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-sm">正解: {progress.correct}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">回答: {progress.answered}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>


            {/* Staff display */}
            <Card className="shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-center text-lg md:text-xl">
                  {currentNote ? (currentNote.clef === 'treble' ? 'ト音記号' : 'ヘ音記号') : ''} - 赤い音符を答えてください
                </CardTitle>
              </CardHeader>
              <CardContent className="relative flex justify-center py-3 md:py-6 bg-white rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-600 shadow-inner">
                <VexflowMultipleNotes
                  notes={notes}
                  targetIndex={currentNoteIndex}
                  width={vexflowDimensions.width}
                  height={vexflowDimensions.height}
                  className="w-full min-w-0"
                />
                
                {/* Result feedback overlay */}
                {showResult && (
                  <div className="absolute top-4 right-4 z-10 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <div className={`p-3 rounded-lg shadow-lg backdrop-blur-sm border-2 ${
                      isCorrect 
                        ? 'bg-green-100/90 dark:bg-green-900/80 text-green-800 dark:text-green-200 border-green-500' 
                        : 'bg-red-100/90 dark:bg-red-900/80 text-red-800 dark:text-red-200 border-red-500'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold">
                          {isCorrect ? '🎉 正解！' : '❌ 不正解'}
                        </span>
                        {getInputMethodIcon()}
                      </div>
                      <p className="text-sm font-medium">
                        答え: {currentNote ? `${getNoteJapaneseName(currentNote.name)} (${currentNote.name})` : '不明'}
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        {lastInputMethod === 'midi' ? 'MIDI' : 'マウス'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              <Button 
                onClick={previousQuestion} 
                disabled={currentNoteIndex === 0}
                variant="outline"
                size="default"
                className="md:size-lg"
              >
                <SkipBack className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                <span className="hidden sm:inline">前の問題</span>
                <span className="sm:hidden">前</span>
              </Button>
              
              <Button 
                onClick={() => setGameState('paused')}
                variant="outline"
                size="default"
                className="md:size-lg"
              >
                <Pause className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                <span className="hidden sm:inline">一時停止</span>
                <span className="sm:hidden">停止</span>
              </Button>
              
              <Button 
                onClick={nextQuestion} 
                disabled={!showResult}
                variant="outline"
                size="default"
                className="md:size-lg"
              >
                {currentNoteIndex === notes.length - 1 ? (
                  <>
                    <span className="hidden sm:inline">練習を完了</span>
                    <span className="sm:hidden">完了</span>
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 ml-1" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">次の問題</span>
                    <span className="sm:hidden">次</span>
                    <SkipForward className="w-4 h-4 md:w-5 md:h-5 ml-1" />
                  </>
                )}
              </Button>
            </div>


            {/* Piano Keyboard */}
            {settings?.practice.enableMouse && (
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-center text-lg md:text-xl">音を選んでください</CardTitle>
                  <p className="text-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    {settings.practice.enableMidi && 'MIDIキーボード、'}
                    ピアノ鍵盤クリックで回答（音が鳴ります）
                  </p>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                  <PianoKeyboard
                    onNoteClick={(note, octave) => handleNoteClick(note, 'mouse', octave)}
                    disabled={showResult}
                    selectedNote={selectedAnswer}
                    selectedOctave={undefined}
                    showResult={showResult}
                    correctNote={currentNote?.name}
                    correctOctave={currentNote?.octave}
                    isCorrect={isCorrect}
                    enableAccidentals={settings.practice.enableAccidentals}
                    noteRange={settings.practice.noteRange}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}

        {gameState === 'paused' && (
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Clock className="w-12 h-12 text-blue-600 mx-auto" />
                <h2 className="text-2xl font-bold">一時停止中</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  準備ができたら練習を再開してください
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={() => setGameState('playing')} size="lg">
                    <Play className="w-5 h-5 mr-2" />
                    再開
                  </Button>
                  <Button onClick={() => setGameState('setup')} variant="outline" size="lg">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    セッション終了
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {gameState === 'completed' && !completedSession && (
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-2xl font-bold">練習完了！</p>
                <p className="text-gray-600">セッション情報の読み込み中...</p>
                <p className="text-sm text-gray-600">進行状況: {progress.answered}問回答済み</p>
                <Button onClick={() => setGameState('setup')} variant="outline" size="lg">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  新しい練習を開始
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {gameState === 'completed' && completedSession && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-2xl">練習完了！</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-green-600">{progress.correct}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">正解数</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {progress.answered > 0 
                      ? ((progress.correct / progress.answered) * 100).toFixed(1) + '%'
                      : '0.0%'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">正解率</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">
                    {completedSession.endTime && completedSession.startTime 
                      ? Math.round((completedSession.endTime.getTime() - completedSession.startTime.getTime()) / 1000)
                      : 0}
                    </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">秒</p>
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button onClick={startSession} size="lg">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  もう一度練習
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="/history">
                    <History className="w-5 h-5 mr-2" />
                    詳細を確認
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}