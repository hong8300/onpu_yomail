'use client';

import React from 'react';
import { NoteName } from '@/lib/types';

interface PianoKeyboardProps {
  onNoteClick: (noteName: NoteName, octave?: number) => void;
  disabled?: boolean;
  selectedNote?: NoteName | null;
  selectedOctave?: number;
  showResult?: boolean;
  correctNote?: NoteName;
  correctOctave?: number;
  isCorrect?: boolean;
  enableAccidentals?: boolean;
  noteRange?: {
    min: string;  // e.g., 'C3'
    max: string;  // e.g., 'C6'
  };
}

interface KeyInfo {
  note: NoteName;
  isBlack: boolean;
  width: string;
  position: string;
  japaneseLabel: string;
}

const WHITE_KEYS: KeyInfo[] = [
  { note: 'C', isBlack: false, width: 'w-12', position: 'left-0', japaneseLabel: 'ド' },
  { note: 'D', isBlack: false, width: 'w-12', position: 'left-12', japaneseLabel: 'レ' },
  { note: 'E', isBlack: false, width: 'w-12', position: 'left-24', japaneseLabel: 'ミ' },
  { note: 'F', isBlack: false, width: 'w-12', position: 'left-36', japaneseLabel: 'ファ' },
  { note: 'G', isBlack: false, width: 'w-12', position: 'left-48', japaneseLabel: 'ソ' },
  { note: 'A', isBlack: false, width: 'w-12', position: 'left-60', japaneseLabel: 'ラ' },
  { note: 'B', isBlack: false, width: 'w-12', position: 'left-72', japaneseLabel: 'シ' },
];

const BLACK_KEYS: KeyInfo[] = [
  { note: 'C#', isBlack: true, width: 'w-8', position: 'left-8', japaneseLabel: 'ド#' },
  { note: 'D#', isBlack: true, width: 'w-8', position: 'left-20', japaneseLabel: 'レ#' },
  { note: 'F#', isBlack: true, width: 'w-8', position: 'left-44', japaneseLabel: 'ファ#' },
  { note: 'G#', isBlack: true, width: 'w-8', position: 'left-56', japaneseLabel: 'ソ#' },
  { note: 'A#', isBlack: true, width: 'w-8', position: 'left-68', japaneseLabel: 'ラ#' },
];

export function PianoKeyboard({
  onNoteClick,
  disabled = false,
  selectedNote,
  selectedOctave,
  showResult = false,
  correctNote,
  correctOctave,
  isCorrect,
  enableAccidentals = false,
  noteRange = { min: 'C4', max: 'C5' }
}: PianoKeyboardProps) {
  // Parse note range to determine which octaves to display
  const parseNoteRange = (noteStr: string): { note: string; octave: number } => {
    const match = noteStr.match(/([A-G]#?)(\d+)/);
    if (!match) return { note: 'C', octave: 4 };
    return { note: match[1], octave: parseInt(match[2]) };
  };

  const minNote = parseNoteRange(noteRange.min);
  const maxNote = parseNoteRange(noteRange.max);
  
  // Determine octaves to display
  const minOctave = minNote.octave;
  const maxOctave = maxNote.octave;
  const octaveCount = maxOctave - minOctave + 1;

  const getKeyStyle = (key: KeyInfo, octave: number) => {
    const isSelected = selectedNote === key.note && (!selectedOctave || selectedOctave === octave);
    const isCorrectAnswer = correctNote === key.note && (!correctOctave || correctOctave === octave);
    
    let baseStyle = '';
    let selectedStyle = '';
    
    if (key.isBlack) {
      baseStyle = 'bg-gray-900 text-white border-gray-700 hover:bg-gray-800';
      if (showResult && isSelected) {
        selectedStyle = isCorrect ? 'bg-green-600 border-green-500' : 'bg-red-600 border-red-500';
      }
      if (showResult && !isCorrect && isCorrectAnswer) {
        selectedStyle += ' ring-2 ring-green-400';
      }
    } else {
      baseStyle = 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50';
      if (showResult && isSelected) {
        selectedStyle = isCorrect ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800';
      }
      if (showResult && !isCorrect && isCorrectAnswer) {
        selectedStyle += ' ring-2 ring-green-500';
      }
    }
    
    return `${baseStyle} ${selectedStyle}`;
  };

  const renderKey = (key: KeyInfo, octave: number, octaveIndex: number) => {
    const isBlackKeyDisabled = key.isBlack && !enableAccidentals;
    
    // Calculate position based on octave with original spacing (48px per key)
    const basePosition = parseInt(key.position.replace('left-', '')) * 4; // Convert Tailwind units to pixels
    const octaveOffset = octaveIndex * 336; // 84 * 4 = 336px per octave (7 keys * 48px)
    const leftPosition = basePosition + octaveOffset;
    
    return (
      <button
        key={`${key.note}-${octave}`}
        onClick={() => onNoteClick(key.note, octave)}
        disabled={disabled || showResult || isBlackKeyDisabled}
        className={`
          absolute
          ${key.isBlack ? 'w-8' : 'w-12'}
          ${key.isBlack ? 'h-20' : 'h-32'}
          ${key.isBlack ? 'z-10' : 'z-0'}
          border-2
          rounded-b-lg
          transition-all
          duration-150
          active:scale-95
          disabled:cursor-not-allowed
          ${isBlackKeyDisabled ? 'opacity-40' : 'opacity-100'}
          flex
          flex-col
          justify-end
          items-center
          ${key.isBlack ? 'pb-2' : 'pb-4'}
          shadow-lg
          ${getKeyStyle(key, octave)}
        `}
        style={{ left: `${leftPosition}px` }}
      >
        <span className={`font-medium text-xs ${key.isBlack ? 'text-white' : 'text-gray-700'}`}>
          {key.japaneseLabel}
        </span>
        <span className={`text-xs opacity-75 ${key.isBlack ? 'text-gray-300' : 'text-gray-500'}`}>
          {key.note}{octave}
        </span>
      </button>
    );
  };

  const octaves = [];
  for (let i = minOctave; i <= maxOctave; i++) {
    octaves.push(i);
  }

  // Container width based on octave count with original spacing
  const containerWidth = octaveCount * 336; // 336px per octave

  return (
    <div 
      className={`relative mx-auto bg-gray-100 rounded-lg p-2 overflow-x-auto`}
      style={{ 
        width: `${Math.min(containerWidth + 16, 1200)}px`, // Max width to prevent too wide display
        height: '136px' 
      }}
    >
      {/* Render keys for each octave */}
      {octaves.map((octave, octaveIndex) => (
        <React.Fragment key={octave}>
          {/* 白鍵盤 */}
          {WHITE_KEYS.map(key => renderKey(key, octave, octaveIndex))}
          
          {/* 黒鍵盤（常に表示、シャープ・フラット無効時は薄く表示してクリック不可） */}
          {BLACK_KEYS.map(key => renderKey(key, octave, octaveIndex))}
        </React.Fragment>
      ))}
    </div>
  );
}