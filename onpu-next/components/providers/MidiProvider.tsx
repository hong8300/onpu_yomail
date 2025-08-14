'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useMidi } from '@/hooks/useMidi';
import { NoteName } from '@/lib/types';

interface MidiContextType {
  isSupported: boolean;
  isConnected: boolean;
  devices: any[];
  connectMidi: () => Promise<void>;
  disconnectMidi: () => void;
  onNoteOn: (callback: (noteName: NoteName, octave: number) => void) => void;
  removeNoteOnListener: () => void;
}

const MidiContext = createContext<MidiContextType | undefined>(undefined);

interface MidiProviderProps {
  children: ReactNode;
}

export function MidiProvider({ children }: MidiProviderProps) {
  const midiState = useMidi();

  return (
    <MidiContext.Provider value={midiState}>
      {children}
    </MidiContext.Provider>
  );
}

export function useMidiContext(): MidiContextType {
  const context = useContext(MidiContext);
  if (context === undefined) {
    throw new Error('useMidiContext must be used within a MidiProvider');
  }
  return context;
}