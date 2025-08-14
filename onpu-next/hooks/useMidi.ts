'use client';

import { useState, useEffect, useCallback } from 'react';
import { NoteName } from '@/lib/types';

interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

interface UseMidiReturn {
  isSupported: boolean;
  isConnected: boolean;
  devices: MidiDevice[];
  connectMidi: () => Promise<void>;
  disconnectMidi: () => void;
  onNoteOn: (callback: (noteName: NoteName, octave: number) => void) => void;
  removeNoteOnListener: () => void;
}

// MIDI note number to note name mapping
// Generate all C-B notes across all octaves (0-127)
const MIDI_TO_NOTE: Record<number, NoteName> = {};

// Generate mapping for all MIDI notes (0-127)
for (let midiNote = 0; midiNote <= 127; midiNote++) {
  const noteIndex = midiNote % 12;
  const noteNames: NoteName[] = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
  // Skip sharp/flat notes (indices 1, 3, 6, 8, 10)
  if (noteIndex === 1 || noteIndex === 3 || noteIndex === 6 || noteIndex === 8 || noteIndex === 10) {
    continue; // Skip sharps/flats
  }
  
  const mappedIndex = noteIndex > 4 ? noteIndex - 1 : noteIndex; // Adjust for skipped sharps
  const noteName = noteNames[Math.floor(mappedIndex / 2) + (noteIndex === 0 ? 0 : noteIndex === 2 ? 1 : noteIndex === 4 ? 2 : noteIndex === 5 ? 3 : noteIndex === 7 ? 4 : noteIndex === 9 ? 5 : 6)];
  
  // Simpler approach - direct mapping
  const note = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][noteIndex];
  if (!note.includes('#')) { // Only natural notes
    MIDI_TO_NOTE[midiNote] = note as NoteName;
  }
}

// Persist MIDI connection state across page navigations using sessionStorage
const MIDI_STATE_KEY = 'onpu-midi-state';

// Global state to persist MIDI connection across page navigations
let globalMidiAccess: any = null;
let globalIsConnected = false;
let globalDevices: MidiDevice[] = [];

// Load state from sessionStorage
if (typeof window !== 'undefined') {
  try {
    const savedState = sessionStorage.getItem(MIDI_STATE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      globalIsConnected = parsed.isConnected || false;
      globalDevices = parsed.devices || [];
      console.log('Loaded MIDI state from sessionStorage:', { globalIsConnected, deviceCount: globalDevices.length });
    }
  } catch (error) {
    console.warn('Failed to load MIDI state from sessionStorage:', error);
  }
}

// Save state to sessionStorage
const saveMidiState = () => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(MIDI_STATE_KEY, JSON.stringify({
        isConnected: globalIsConnected,
        devices: globalDevices
      }));
    } catch (error) {
      console.warn('Failed to save MIDI state to sessionStorage:', error);
    }
  }
};

export function useMidi(): UseMidiReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(globalIsConnected);
  const [devices, setDevices] = useState<MidiDevice[]>(globalDevices);
  const [midiAccess, setMidiAccess] = useState<any>(globalMidiAccess);
  const [noteOnCallback, setNoteOnCallback] = useState<((noteName: NoteName, octave: number) => void) | null>(null);

  // Check Web MIDI API support
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const handleMidiMessage = useCallback((event: any) => {
    const [status, note, velocity] = event.data;
    
    // Filter out system messages (status >= 240) to reduce noise
    if (status >= 240) {
      // System messages like timing clock (248), start (250), stop (252), etc.
      return;
    }
    
    console.log('MIDI message received:', {
      status: status,
      note: note,
      velocity: velocity,
      statusHex: status.toString(16),
      noteDecimal: note,
      velocityDecimal: velocity
    });
    
    // Note On message (status byte 144-159, velocity > 0)
    if ((status >= 144 && status <= 159) && velocity > 0) {
      const noteName = MIDI_TO_NOTE[note];
      const octave = Math.floor(note / 12) - 1; // Calculate octave from MIDI note number
      console.log('Note pressed:', note, '-> Note name:', noteName, 'Octave:', octave);
      
      if (noteName && noteOnCallback) {
        console.log('Calling note callback with:', noteName, 'octave:', octave);
        noteOnCallback(noteName, octave);
      } else if (!noteName) {
        console.log('Note not mapped:', note);
      } else if (!noteOnCallback) {
        console.log('No note callback registered');
      }
    } else {
      console.log('Message not a note on or velocity is 0');
    }
  }, [noteOnCallback]);

  // Restore MIDI connection state when hook is re-initialized
  useEffect(() => {
    const restoreConnection = async () => {
      if (globalIsConnected && isSupported) {
        console.log('Attempting to restore MIDI connection state');
        console.log('Global state:', { globalIsConnected, globalDevices: globalDevices.length });
        
        try {
          // Try to get MIDI access again (browsers maintain the permission)
          const access = await navigator.requestMIDIAccess({ sysex: false });
          console.log('MIDI access restored:', access);
          
          globalMidiAccess = access as any;
          setMidiAccess(access as any);
          setIsConnected(globalIsConnected);
          setDevices(globalDevices);
          
          // Set up input listeners for restored connection
          access.inputs.forEach((input) => {
            console.log(`Restoring listener for: ${input.name}`);
            input.addEventListener('midimessage', handleMidiMessage);
          });
          
          // Update devices list inline
          const deviceList: MidiDevice[] = [];
          access.inputs.forEach((input) => {
            deviceList.push({
              id: input.id || '',
              name: input.name || 'Unknown Device',
              manufacturer: input.manufacturer || 'Unknown',
              state: input.state || 'disconnected'
            });
          });
          globalDevices = deviceList;
          setDevices(deviceList);
          saveMidiState();
          
        } catch (error) {
          console.error('Failed to restore MIDI connection:', error);
          globalIsConnected = false;
          globalDevices = [];
          setIsConnected(false);
          setDevices([]);
          saveMidiState();
        }
      }
    };

    if (isSupported) {
      restoreConnection();
    }
  }, [isSupported, handleMidiMessage]);

  const updateDevices = useCallback((midiAccess: WebMidi.MIDIAccess) => {
    const deviceList: MidiDevice[] = [];
    
    midiAccess.inputs.forEach((input) => {
      deviceList.push({
        id: input.id || '',
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
        state: input.state || 'disconnected'
      });
    });
    
    globalDevices = deviceList;
    setDevices(deviceList);
    saveMidiState();
  }, []);

  const connectMidi = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Web MIDI API is not supported in this browser');
    }

    try {
      console.log('Requesting MIDI access...');
      const access = await navigator.requestMIDIAccess({ sysex: false });
      console.log('MIDI access granted:', access);
      
      globalMidiAccess = access as any;
      globalIsConnected = true;
      setMidiAccess(access as any);
      setIsConnected(true);
      saveMidiState();

      // Log all available inputs
      console.log('Available MIDI inputs:');
      access.inputs.forEach((input, id) => {
        console.log(`- ${id}: ${input.name} (${input.manufacturer}) - State: ${input.state}`);
      });

      // Set up input listeners
      access.inputs.forEach((input) => {
        console.log(`Setting up listener for: ${input.name}`);
        input.addEventListener('midimessage', handleMidiMessage);
        
        // Also try opening the input explicitly
        if (input.state === 'connected') {
          try {
            input.open();
            console.log(`Opened input: ${input.name}`);
          } catch (e) {
            console.warn(`Failed to open input ${input.name}:`, e);
          }
        }
      });

      // Handle device changes
      access.addEventListener('statechange', (event) => {
        console.log('MIDI state change:', event);
        console.log('Port details:', {
          port: event.port?.name,
          state: event.port?.state,
          connection: event.port?.connection
        });
        
        updateDevices(access as any);
        
        // Re-setup listeners for newly connected devices
        access.inputs.forEach((input) => {
          if (input.state === 'connected') {
            // Remove existing listener first to avoid duplicates
            input.removeEventListener('midimessage', handleMidiMessage);
            // Add listener
            input.addEventListener('midimessage', handleMidiMessage);
            console.log(`Re-setup listener for: ${input.name}`);
          }
        });
      });

      updateDevices(access as any);
      
      console.log('MIDI connected successfully');
    } catch (error) {
      console.error('Failed to connect MIDI:', error);
      throw error;
    }
  }, [isSupported, handleMidiMessage, updateDevices]);

  const disconnectMidi = useCallback(() => {
    console.log('disconnectMidi called, current midiAccess:', midiAccess);
    console.trace('disconnectMidi called from:');
    
    if (midiAccess) {
      midiAccess.inputs.forEach((input: any) => {
        input.removeEventListener('midimessage', handleMidiMessage);
      });
      globalMidiAccess = null;
      setMidiAccess(null);
    }
    globalIsConnected = false;
    globalDevices = [];
    setIsConnected(false);
    setDevices([]);
    saveMidiState();
    console.log('MIDI disconnected');
  }, [midiAccess, handleMidiMessage]);

  const onNoteOn = useCallback((callback: (noteName: NoteName, octave: number) => void) => {
    console.log('onNoteOn called, setting callback:', !!callback);
    setNoteOnCallback(() => callback);
  }, []);

  const removeNoteOnListener = useCallback(() => {
    setNoteOnCallback(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    console.log('useMidi mounted');
    return () => {
      console.log('useMidi unmounted, calling disconnectMidi');
      // Call disconnectMidi directly without dependency
      if (midiAccess) {
        midiAccess.inputs.forEach((input: any) => {
          input.removeEventListener('midimessage', handleMidiMessage);
        });
      }
    };
  }, []); // Empty dependency array

  // Debug: Log state changes
  useEffect(() => {
    console.log('MIDI state updated:', { 
      isSupported, 
      isConnected, 
      deviceCount: devices.length,
      hasNoteCallback: !!noteOnCallback 
    });
  }, [isSupported, isConnected, devices, noteOnCallback]);

  return {
    isSupported,
    isConnected,
    devices,
    connectMidi,
    disconnectMidi,
    onNoteOn,
    removeNoteOnListener,
  };
}