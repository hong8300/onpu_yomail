'use client';

import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Formatter, Voice, Accidental } from 'vexflow';
import { Note } from '@/lib/types';

interface VexflowStaffProps {
  note: Note;
  width?: number;
  height?: number;
  className?: string;
}

export function VexflowStaff({ 
  note, 
  width = 500, 
  height = 200,
  className = ''
}: VexflowStaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Create renderer
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(width, height);
    rendererRef.current = renderer;

    const context = renderer.getContext();
    context.setFont('Arial', 10);
    context.scale(1.5, 1.5); // Make the staff larger

    // Create stave
    const staveWidth = (width - 20) / 1.5;
    const stave = new Stave(10, 30, staveWidth);
    
    // Add clef
    if (note.clef === 'treble') {
      stave.addClef('treble');
    } else {
      stave.addClef('bass');
    }
    
    stave.setContext(context).draw();

    // Convert note to Vexflow format
    const noteString = `${note.name.toLowerCase()}/${note.octave}`;
    
    // Create a StaveNote
    const staveNote = new StaveNote({
      keys: [noteString],
      duration: 'w', // whole note
      clef: note.clef
    });

    // Create a voice in 4/4 time and add the note
    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickables([staveNote]);

    // Format and draw
    new Formatter().joinVoices([voice]).format([voice], staveWidth - 100);
    voice.draw(context, stave);

  }, [note, width, height]);

  return (
    <div 
      ref={containerRef} 
      className={`flex justify-center items-center bg-white ${className}`}
      style={{ minHeight: height }}
    />
  );
}