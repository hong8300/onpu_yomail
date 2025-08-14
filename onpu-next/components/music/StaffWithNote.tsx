'use client';

import React from 'react';
import { Note, Clef } from '@/lib/types';
import { Staff } from './Staff';
import { MusicNote } from './MusicNote';

interface StaffWithNoteProps {
  note: Note;
  width?: number;
  height?: number;
  className?: string;
}

export function StaffWithNote({ 
  note, 
  width = 400, 
  height = 200,
  className = ''
}: StaffWithNoteProps) {
  const lineSpacing = 20;
  const staffTop = 60;

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={className}
      >
        {/* Staff lines */}
        {Array.from({ length: 5 }, (_, i) => (
          <line
            key={i}
            x1={20}
            y1={staffTop + i * lineSpacing}
            x2={width - 20}
            y2={staffTop + i * lineSpacing}
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}

        {/* Clef symbol */}
        {note.clef === 'treble' ? (
          <g transform={`translate(30, ${staffTop})`}>
            <path
              d="M 0 40 
                 Q -5 20, 0 0
                 Q 5 -20, 0 -40
                 Q -8 -30, -8 -10
                 Q -8 10, 5 20
                 Q 15 30, 15 40
                 Q 15 50, 5 55
                 Q -5 60, -5 50
                 Q -5 45, 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <ellipse cx="0" cy="55" rx="6" ry="4" fill="currentColor" />
          </g>
        ) : (
          <g transform={`translate(30, ${staffTop + lineSpacing})`}>
            <path
              d="M 0 0
                 C -10 0, -15 -10, -15 -20
                 C -15 -30, -10 -40, 0 -40
                 C 5 -40, 10 -35, 10 -20
                 C 10 -5, 5 0, 0 0"
              fill="currentColor"
            />
            <circle cx="15" cy="-30" r="3" fill="currentColor" />
            <circle cx="15" cy="-10" r="3" fill="currentColor" />
          </g>
        )}

        {/* Note */}
        <MusicNote 
          note={note} 
          x={200}
          staffTop={staffTop}
          lineSpacing={lineSpacing}
        />

        {/* End barline */}
        <line
          x1={width - 20}
          y1={staffTop}
          x2={width - 20}
          y2={staffTop + 80}
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}