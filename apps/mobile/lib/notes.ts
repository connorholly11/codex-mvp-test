import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTES_STORAGE_KEY = "@purpose/tool-notes/v1";
const MAX_NOTES = 100;

export type SavedNote = {
  id: string;
  title: string | null;
  body: string;
  createdAt: string;
};

type StoredNotesPayload = {
  version: 1;
  notes: SavedNote[];
};

async function loadNotes(): Promise<StoredNotesPayload> {
  try {
    const raw = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) {
      return { version: 1, notes: [] };
    }
    const parsed = JSON.parse(raw) as StoredNotesPayload | null;
    if (!parsed || !Array.isArray(parsed.notes)) {
      return { version: 1, notes: [] };
    }
    return {
      version: 1,
      notes: parsed.notes.filter(
        (note) => typeof note.id === "string" && typeof note.body === "string",
      ),
    };
  } catch (error) {
    console.warn("Failed to load saved notes", error);
    return { version: 1, notes: [] };
  }
}

async function persistNotes(payload: StoredNotesPayload): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to persist notes", error);
  }
}

export async function saveLocalNote(options: {
  title?: string | null;
  body: string;
}): Promise<SavedNote> {
  const createdAt = new Date().toISOString();
  const note: SavedNote = {
    id: `note_${Date.now()}`,
    title: options.title?.trim() ? options.title.trim() : null,
    body: options.body,
    createdAt,
  };

  const payload = await loadNotes();
  const nextNotes = [note, ...payload.notes].slice(0, MAX_NOTES);
  await persistNotes({ version: 1, notes: nextNotes });

  return note;
}
