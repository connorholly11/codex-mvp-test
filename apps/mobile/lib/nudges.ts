import { logEvent } from "@purpose/analytics";
import {
  fetchNudges,
  updateNudgeStatus,
  type Nudge,
} from "@purpose/api-client";

import { scheduleOneOffReminder } from "./notifications";

type SyncOptions = {
  accessToken?: string;
};

function coerceString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

async function handleReminderNudge(nudge: Nudge, options: SyncOptions): Promise<void> {
  const fireDate = new Date(nudge.scheduledFor);
  if (Number.isNaN(fireDate.getTime())) {
    await updateNudgeStatus(
      { id: nudge.id, status: "dismissed", context: { reason: "invalid_datetime" } },
      options,
    );
    return;
  }

  const now = Date.now();
  if (fireDate.getTime() <= now + 60 * 1000) {
    await updateNudgeStatus(
      { id: nudge.id, status: "dismissed", context: { reason: "expired" } },
      options,
    );
    return;
  }

  const payload = (nudge.payload ?? {}) as Record<string, unknown>;

  const title = coerceString(payload.title, "Fermi check-in");
  const body = coerceString(
    payload.body,
    "Take a breath and jot down one thing you noticed today.",
  );

  const notificationId = await scheduleOneOffReminder({ fireDate, title, body });
  if (!notificationId) {
    await updateNudgeStatus(
      { id: nudge.id, status: "dismissed", context: { reason: "notifications_disabled" } },
      options,
    );
    return;
  }

  await updateNudgeStatus(
    {
      id: nudge.id,
      status: "scheduled",
      context: {
        notificationId,
        scheduledFor: fireDate.toISOString(),
      },
    },
    options,
  );

  logEvent("nudge_scheduled", {
    nudgeId: nudge.id,
    kind: nudge.kind,
    scheduledFor: fireDate.toISOString(),
  });
}

export async function syncPendingNudges(options: SyncOptions): Promise<void> {
  try {
    const nudges = await fetchNudges({
      accessToken: options.accessToken,
      statuses: ['pending'],
    });

    for (const nudge of nudges) {
      try {
        if (nudge.kind === "schedule_reminder" || nudge.kind === "local_reminder") {
          await handleReminderNudge(nudge, options);
        } else {
          await updateNudgeStatus(
            { id: nudge.id, status: "dismissed", context: { reason: "unsupported_kind" } },
            options,
          );
        }
      } catch (error) {
        console.warn("Failed to process nudge", nudge.id, error);
        await updateNudgeStatus(
          { id: nudge.id, status: "dismissed", context: { reason: "processing_error" } },
          options,
        );
      }
    }
  } catch (error) {
    console.warn("Failed to sync nudges", error);
  }
}
