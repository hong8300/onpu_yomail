'use client';

import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Formatter, Voice, StaveConnector } from 'vexflow';
import { Note } from '@/lib/types';

interface VexflowMultipleNotesProps {
  notes: Note[];
  targetIndex: number; // Which note to highlight in red
  width?: number;
  height?: number;
  className?: string;
}

export function VexflowMultipleNotes({ 
  notes, 
  targetIndex,
  width = 1200, 
  height = 400,  // Increased height to accommodate both staves
  className = ''
}: VexflowMultipleNotesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    if (!containerRef.current || notes.length === 0) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Create renderer
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(width, height);
    rendererRef.current = renderer;

    const context = renderer.getContext();
    context.setFont('Arial', 10);
    context.scale(1.3, 1.3); // Scale for better visibility

    // Create staves for both clefs
    const staveWidth = (width - 40) / 1.3;
    const staveHeight = 120; // Height between staves
    
    // Create treble stave
    const trebleStave = new Stave(20, 20, staveWidth);
    trebleStave.addClef('treble');
    trebleStave.addTimeSignature('4/4');
    trebleStave.setContext(context).draw();
    
    // Create bass stave
    const bassStave = new Stave(20, 20 + staveHeight, staveWidth);
    bassStave.addClef('bass');
    bassStave.addTimeSignature('4/4');
    bassStave.setContext(context).draw();
    
    // Connect staves with brace and line
    const brace = new StaveConnector(trebleStave, bassStave);
    brace.setType(StaveConnector.type.BRACE);
    brace.setContext(context).draw();
    
    const lineLeft = new StaveConnector(trebleStave, bassStave);
    lineLeft.setType(StaveConnector.type.SINGLE_LEFT);
    lineLeft.setContext(context).draw();

    // Calculate measures (4 notes per measure)
    const notesPerMeasure = 4;
    const measureCount = Math.ceil(notes.length / notesPerMeasure);
    const measureWidth = (staveWidth - 100) / measureCount;

    // Separate notes by clef
    const trebleNotes: typeof notes = [];
    const bassNotes: typeof notes = [];
    const trebleIndices: number[] = [];
    const bassIndices: number[] = [];
    
    notes.forEach((note, index) => {
      if (note.clef === 'treble') {
        trebleNotes.push(note);
        trebleIndices.push(index);
      } else {
        bassNotes.push(note);
        bassIndices.push(index);
      }
    });

    // Draw measures and notes for both staves
    for (let measureIndex = 0; measureIndex < measureCount; measureIndex++) {
      const measureX = 80 + measureIndex * measureWidth;
      
      // Create staves for this measure (first measure already created)
      let currentTrebleStave, currentBassStave;
      if (measureIndex === 0) {
        currentTrebleStave = trebleStave;
        currentBassStave = bassStave;
      } else {
        currentTrebleStave = new Stave(measureX, 20, measureWidth);
        currentTrebleStave.setContext(context).draw();
        
        currentBassStave = new Stave(measureX, 20 + staveHeight, measureWidth);
        currentBassStave.setContext(context).draw();
        
        // Connect staves
        const lineRight = new StaveConnector(currentTrebleStave, currentBassStave);
        lineRight.setType(StaveConnector.type.SINGLE_RIGHT);
        lineRight.setContext(context).draw();
      }

      // Get notes for this measure
      const startIndex = measureIndex * notesPerMeasure;
      const endIndex = Math.min(startIndex + notesPerMeasure, notes.length);
      const measureNotes = notes.slice(startIndex, endIndex);

      if (measureNotes.length === 0) continue;

      // Create StaveNotes for treble clef
      const trebleStaveNotes = measureNotes.map((note, noteIndex) => {
        const globalIndex = startIndex + noteIndex;
        
        if (note.clef === 'treble') {
          const noteString = `${note.name.toLowerCase()}/${note.octave}`;
          
          const staveNote = new StaveNote({
            keys: [noteString],
            duration: '4', // quarter note
            clef: 'treble'
          });

          // Color the target note red
          if (globalIndex === targetIndex) {
            staveNote.setStyle({ fillStyle: '#FF0000', strokeStyle: '#FF0000' });
          }

          return staveNote;
        } else {
          // Add rest for bass notes in treble clef
          return new StaveNote({
            keys: ['b/4'],
            duration: '4r', // quarter rest
            clef: 'treble'
          });
        }
      });

      // Create StaveNotes for bass clef
      const bassStaveNotes = measureNotes.map((note, noteIndex) => {
        const globalIndex = startIndex + noteIndex;
        
        if (note.clef === 'bass') {
          const noteString = `${note.name.toLowerCase()}/${note.octave}`;
          
          const staveNote = new StaveNote({
            keys: [noteString],
            duration: '4', // quarter note
            clef: 'bass'
          });

          // Color the target note red
          if (globalIndex === targetIndex) {
            staveNote.setStyle({ fillStyle: '#FF0000', strokeStyle: '#FF0000' });
          }

          return staveNote;
        } else {
          // Add rest for treble notes in bass clef
          return new StaveNote({
            keys: ['d/3'],
            duration: '4r', // quarter rest
            clef: 'bass'
          });
        }
      });

      // Add rests if measure is not complete
      while (trebleStaveNotes.length < notesPerMeasure) {
        const rest = new StaveNote({
          keys: ['b/4'],
          duration: '4r', // quarter rest
          clef: 'treble'
        });
        trebleStaveNotes.push(rest);
      }
      
      while (bassStaveNotes.length < notesPerMeasure) {
        const rest = new StaveNote({
          keys: ['d/3'],
          duration: '4r', // quarter rest
          clef: 'bass'
        });
        bassStaveNotes.push(rest);
      }

      // Create voices for this measure
      const trebleVoice = new Voice({ numBeats: 4, beatValue: 4 });
      trebleVoice.addTickables(trebleStaveNotes);
      
      const bassVoice = new Voice({ numBeats: 4, beatValue: 4 });
      bassVoice.addTickables(bassStaveNotes);

      // Format and draw
      new Formatter().joinVoices([trebleVoice]).format([trebleVoice], measureWidth - 20);
      trebleVoice.draw(context, currentTrebleStave);
      
      new Formatter().joinVoices([bassVoice]).format([bassVoice], measureWidth - 20);
      bassVoice.draw(context, currentBassStave);
    }

  }, [notes, targetIndex, width, height]);

  return (
    <div 
      ref={containerRef} 
      className={`flex justify-center items-center bg-white ${className}`}
      style={{ minHeight: height }}
    />
  );
}