import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const baseDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

const ICS_CACHE_DIR = baseDirectory
  ? `${baseDirectory.replace(/\/?$/, "/")}ics`
  : null;

function formatDateToICS(date: Date): string {
  const yyyy = date.getUTCFullYear().toString().padStart(4, "0");
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = date.getUTCDate().toString().padStart(2, "0");
  const hh = date.getUTCHours().toString().padStart(2, "0");
  const min = date.getUTCMinutes().toString().padStart(2, "0");
  const ss = date.getUTCSeconds().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

function sanitizeICSValue(value: string | undefined | null): string {
  if (!value) {
    return "";
  }
  return value.replace(/\r?\n/g, "\\n");
}

async function ensureCacheDir(): Promise<string> {
  if (!ICS_CACHE_DIR) {
    throw new Error("Missing cache directory for calendar exports.");
  }
  const info = await FileSystem.getInfoAsync(ICS_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(ICS_CACHE_DIR, { intermediates: true });
  }
  return ICS_CACHE_DIR;
}

export async function createAndShareIcsEvent(options: {
  title: string;
  description?: string;
  start: Date;
  durationMinutes: number;
}): Promise<{ fileUri: string; shared: boolean }> {
  const directory = await ensureCacheDir();
  const uid = `purpose-${Date.now()}@purpose-app`;
  const dtStamp = formatDateToICS(new Date());
  const dtStart = formatDateToICS(options.start);
  const dtEnd = formatDateToICS(new Date(options.start.getTime() + options.durationMinutes * 60000));

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Purpose//ToolBridge v2//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${sanitizeICSValue(options.title)}`,
    options.description ? `DESCRIPTION:${sanitizeICSValue(options.description)}` : undefined,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .filter(Boolean)
    .join("\r\n");

  const fileUri = `${directory}/event-${Date.now()}.ics`;
  await FileSystem.writeAsStringAsync(fileUri, icsContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let shared = false;
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/calendar",
        dialogTitle: "Add to calendar",
        UTI: "public.ics",
      });
      shared = true;
    }
  } catch (error) {
    console.warn("Failed to open sharing dialog for ICS event", error);
  }

  return { fileUri, shared };
}
