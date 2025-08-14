import { Note, NoteName, Clef, NotePosition } from './types';

// Define note positions for treble and bass clefs
// Y positions: 0 = top line of staff, step of 5 = one line/space
const TREBLE_POSITIONS: Record<string, NotePosition> = {
  'C6': { y: -10, ledgerLines: 2, ledgerLineAbove: true },
  'B5': { y: -5, ledgerLines: 1, ledgerLineAbove: true },
  'A5': { y: 0 },  // Top line
  'G5': { y: 5 },
  'F5': { y: 10 }, // Top line
  'E5': { y: 15 },
  'D5': { y: 20 }, // Second line
  'C5': { y: 25 },
  'B4': { y: 30 }, // Third line
  'A4': { y: 35 },
  'G4': { y: 40 }, // Fourth line
  'F4': { y: 45 },
  'E4': { y: 50 }, // Bottom line
  'D4': { y: 55 },
  'C4': { y: 60, ledgerLines: 1, ledgerLineAbove: false }, // Middle C
  'B3': { y: 65, ledgerLines: 1, ledgerLineAbove: false },
  'A3': { y: 70, ledgerLines: 2, ledgerLineAbove: false },
};

const BASS_POSITIONS: Record<string, NotePosition> = {
  'E4': { y: -10, ledgerLines: 2, ledgerLineAbove: true },
  'D4': { y: -5, ledgerLines: 1, ledgerLineAbove: true },
  'C4': { y: 0, ledgerLines: 1, ledgerLineAbove: true }, // Middle C
  'B3': { y: 5 },
  'A3': { y: 10 }, // Top line
  'G3': { y: 15 },
  'F3': { y: 20 }, // Second line
  'E3': { y: 25 },
  'D3': { y: 30 }, // Third line
  'C3': { y: 35 },
  'B2': { y: 40 }, // Fourth line
  'A2': { y: 45 },
  'G2': { y: 50 }, // Bottom line
  'F2': { y: 55 },
  'E2': { y: 60, ledgerLines: 1, ledgerLineAbove: false },
  'D2': { y: 65, ledgerLines: 1, ledgerLineAbove: false },
  'C2': { y: 70, ledgerLines: 2, ledgerLineAbove: false },
  'B1': { y: 75, ledgerLines: 2, ledgerLineAbove: false },
  'A1': { y: 80, ledgerLines: 3, ledgerLineAbove: false },
  'G1': { y: 85, ledgerLines: 3, ledgerLineAbove: false },
  'F1': { y: 90, ledgerLines: 4, ledgerLineAbove: false },
  'E1': { y: 95, ledgerLines: 4, ledgerLineAbove: false },
  'D1': { y: 100, ledgerLines: 5, ledgerLineAbove: false },
  'C1': { y: 105, ledgerLines: 5, ledgerLineAbove: false },
};

export function getNotePosition(note: string, clef: Clef): NotePosition | undefined {
  if (clef === 'treble') {
    return TREBLE_POSITIONS[note];
  } else {
    return BASS_POSITIONS[note];
  }
}

export function createNote(name: NoteName, octave: number, clef: Clef): Note | null {
  const noteString = `${name}${octave}`;
  const position = getNotePosition(noteString, clef);
  
  if (!position) {
    return null;
  }

  return {
    name,
    octave,
    clef,
    position
  };
}

// Get all available notes for a given clef and range
export function getAvailableNotes(
  clef: Clef,
  minNote: string = 'C1',
  maxNote: string = 'C6'
): Note[] {
  const notes: Note[] = [];
  const positions = clef === 'treble' ? TREBLE_POSITIONS : BASS_POSITIONS;
  
  // Parse note strings to compare properly
  const parseNote = (noteStr: string) => {
    const name = noteStr[0];
    const octave = parseInt(noteStr[1]);
    // Convert to a comparable number (octave * 7 + note position in scale)
    const noteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    return octave * 7 + noteOrder.indexOf(name);
  };
  
  const minValue = parseNote(minNote);
  const maxValue = parseNote(maxNote);
  
  for (const [noteString, position] of Object.entries(positions)) {
    const noteValue = parseNote(noteString);
    if (noteValue >= minValue && noteValue <= maxValue) {
      const name = noteString[0] as NoteName;
      const octave = parseInt(noteString[1]);
      notes.push({
        name,
        octave,
        clef,
        position
      });
    }
  }
  
  return notes;
}

// Generate a random note avoiding the previous one
export function getRandomNote(
  availableNotes: Note[],
  previousNote?: Note
): Note {
  if (availableNotes.length === 0) {
    throw new Error('No available notes');
  }
  
  if (availableNotes.length === 1) {
    return availableNotes[0];
  }
  
  let note: Note;
  do {
    const index = Math.floor(Math.random() * availableNotes.length);
    note = availableNotes[index];
  } while (
    previousNote &&
    note.name === previousNote.name &&
    note.octave === previousNote.octave
  );
  
  return note;
}