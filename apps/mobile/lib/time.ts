const reminderFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const eventFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatReminderTarget(date: Date): string {
  try {
    return reminderFormatter.format(date);
  } catch (error) {
    console.warn("Failed to format reminder target", error);
    return date.toLocaleString();
  }
}

export function formatTimerDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  return `${minutes} minute${minutes === 1 ? "" : "s"} ${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"}`;
}

export function formatLocationDisplay(options: {
  city: string | null;
  region: string | null;
  country: string | null;
}): string {
  const parts = [options.city, options.region, options.country].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(", ") : "your approximate area";
}

export function formatEventWindow(start: Date, durationMinutes: number): string {
  try {
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const startLabel = eventFormatter.format(start);
    const endLabel = eventFormatter.format(end);
    if (startLabel === endLabel) {
      return `${startLabel} (${durationMinutes} min)`;
    }
    return `${startLabel} -> ${endLabel}`;
  } catch (error) {
    console.warn("Failed to format calendar window", error);
    return `${start.toLocaleString()} (${durationMinutes} min)`;
  }
}
