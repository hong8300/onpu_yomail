'use client';

import React from 'react';
import { Note } from '@/lib/types';

interface MusicNoteProps {
  note: Note;
  x?: number;
  staffTop?: number;
  lineSpacing?: number;
}

export function MusicNote({ 
  note, 
  x = 200, 
  staffTop = 60,
  lineSpacing = 20 
}: MusicNoteProps) {
  const noteY = staffTop + (note.position.y / 10) * lineSpacing;

  // Render ledger lines if needed
  const renderLedgerLines = () => {
    if (!note.position.ledgerLines) return null;

    const lines = [];
    const ledgerLineWidth = 30;
    const ledgerX = x - ledgerLineWidth / 2;

    for (let i = 1; i <= note.position.ledgerLines; i++) {
      const yOffset = note.position.ledgerLineAbove
        ? staffTop - i * lineSpacing
        : staffTop + 4 * lineSpacing + i * lineSpacing;

      lines.push(
        <line
          key={`ledger-${i}`}
          x1={ledgerX}
          y1={yOffset}
          x2={ledgerX + ledgerLineWidth}
          y2={yOffset}
          stroke="currentColor"
          strokeWidth="1"
        />
      );
    }

    return lines;
  };

  return (
    <g>
      {/* Ledger lines */}
      {renderLedgerLines()}

      {/* Note head */}
      <ellipse
        cx={x}
        cy={noteY}
        rx="7"
        ry="5"
        fill="currentColor"
        transform={`rotate(-20 ${x} ${noteY})`}
      />

      {/* Note stem */}
      <line
        x1={note.position.y < 25 ? x + 7 : x - 7}
        y1={noteY}
        x2={note.position.y < 25 ? x + 7 : x - 7}
        y2={note.position.y < 25 ? noteY + 35 : noteY - 35}
        stroke="currentColor"
        strokeWidth="2"
      />
    </g>
  );
}