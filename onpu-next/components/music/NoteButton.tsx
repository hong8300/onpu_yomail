'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { NoteName } from '@/lib/types';

interface NoteButtonProps {
  noteName: NoteName;
  onClick: (note: NoteName) => void;
  disabled?: boolean;
  className?: string;
}

const NOTE_LABELS: Record<NoteName, string> = {
  'C': 'ド (C)',
  'C#': 'ド# (C#)',
  'D': 'レ (D)',
  'D#': 'レ# (D#)',
  'E': 'ミ (E)',
  'F': 'ファ (F)',
  'F#': 'ファ# (F#)',
  'G': 'ソ (G)',
  'G#': 'ソ# (G#)',
  'A': 'ラ (A)',
  'A#': 'ラ# (A#)',
  'B': 'シ (B)',
};

export function NoteButton({ 
  noteName, 
  onClick, 
  disabled = false,
  className = ''
}: NoteButtonProps) {
  return (
    <Button
      onClick={() => onClick(noteName)}
      disabled={disabled}
      className={`min-w-[100px] ${className}`}
      size="lg"
      variant="outline"
    >
      {NOTE_LABELS[noteName]}
    </Button>
  );
}