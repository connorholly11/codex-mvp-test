import { logEvent } from "@purpose/analytics";
import {
  type AssistantToolCall,
  type ScheduleReminderToolCall,
  type StartTimerToolCall,
  type GetLocationToolCall,
  type SaveNoteToolCall,
  type CreateIcsEventToolCall,
} from "@purpose/api-client";

import { createAndShareIcsEvent } from "./calendar";
import { fetchCityLocation } from "./location";
import { saveLocalNote } from "./notes";
import {
  scheduleCountdownTimer,
  scheduleOneOffReminder,
} from "./notifications";
import {
  formatEventWindow,
  formatLocationDisplay,
  formatReminderTarget,
  formatTimerDuration,
} from "./time";

export type ToolExecutionResult = {
  confirmationText: string;
  metadataContext?: Record<string, unknown>;
  analyticsPayload?: Record<string, unknown>;
};

export class ToolExecutionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "permission_denied"
      | "validation_error"
      | "not_supported"
      | "share_unavailable"
      | "unknown" = "unknown",
  ) {
    super(message);
  }
}

function assertReminderDate(tool: ScheduleReminderToolCall): Date {
  const date = new Date(tool.args.iso_datetime);
  if (Number.isNaN(date.getTime())) {
    throw new ToolExecutionError(
      "Fermi suggested a reminder but the time was invalid.",
      "validation_error",
    );
  }
  const now = Date.now();
  if (date.getTime() <= now + 60000) {
    throw new ToolExecutionError(
      "The reminder time needs to be at least a minute in the future.",
      "validation_error",
    );
  }
  return date;
}

function deriveTimerLabel(tool: StartTimerToolCall): string {
  return tool.args.label ?? "Timer";
}

function isScheduleReminder(tool: AssistantToolCall): tool is ScheduleReminderToolCall {
  return tool.name === "schedule_reminder" && tool.validation?.valid === true;
}

function isStartTimer(tool: AssistantToolCall): tool is StartTimerToolCall {
  return tool.name === "start_timer" && tool.validation?.valid === true;
}

function isGetLocation(tool: AssistantToolCall): tool is GetLocationToolCall {
  return tool.name === "get_location" && tool.validation?.valid === true;
}

function isSaveNote(tool: AssistantToolCall): tool is SaveNoteToolCall {
  return tool.name === "save_note" && tool.validation?.valid === true;
}

function isCreateIcsEvent(tool: AssistantToolCall): tool is CreateIcsEventToolCall {
  return tool.name === "create_ics_event" && tool.validation?.valid === true;
}

export function isSupportedTool(tool: AssistantToolCall): boolean {
  return (
    isScheduleReminder(tool) ||
      isStartTimer(tool) ||
      isGetLocation(tool) ||
      isSaveNote(tool) ||
      isCreateIcsEvent(tool)
  );
}

export async function executeTool(
  tool: AssistantToolCall,
): Promise<ToolExecutionResult> {
  if (tool.validation?.valid !== true) {
    throw new ToolExecutionError(
      "Fermi needs a moment to double-check that suggestion.",
      "validation_error",
    );
  }

  if (isScheduleReminder(tool)) {
    const reminderDate = assertReminderDate(tool);
      const notificationId = await scheduleOneOffReminder({
        fireDate: reminderDate,
        title: tool.args.title,
        body: tool.args.body,
      });

      if (!notificationId) {
        throw new ToolExecutionError(
          "Notifications are disabled. Turn them on in Settings to schedule reminders.",
          "permission_denied",
        );
      }

      return {
        confirmationText: `Reminder scheduled for ${formatReminderTarget(reminderDate)}.`,
        metadataContext: {
          scheduledFor: reminderDate.toISOString(),
          notificationId,
        },
        analyticsPayload: {
          scheduledFor: reminderDate.toISOString(),
        },
      };
  }

  if (isStartTimer(tool)) {
    const { duration_seconds: durationSeconds } = tool.args;
    const timerLabel = deriveTimerLabel(tool);

    const timerResult = await scheduleCountdownTimer({
      durationSeconds,
      title: timerLabel,
      body: `${timerLabel} finished.`,
    });

    if (!timerResult) {
      throw new ToolExecutionError(
        "Notifications are disabled. Turn them on in Settings to run timers.",
        "permission_denied",
      );
    }

    return {
      confirmationText: `Starting a ${formatTimerDuration(durationSeconds)} timer.`,
      metadataContext: {
        timer: {
          duration_seconds: durationSeconds,
          fireDate: timerResult.fireDate.toISOString(),
          notificationId: timerResult.notificationId,
          label: timerLabel,
        },
      },
      analyticsPayload: {
        duration_seconds: durationSeconds,
      },
    };
  }

  if (isGetLocation(tool)) {
    const result = await fetchCityLocation();
      if (result.kind === "denied") {
        throw new ToolExecutionError(result.message, "permission_denied");
      }
      if (result.kind === "error") {
        throw new ToolExecutionError(result.message, "unknown");
      }

      const locationLabel = formatLocationDisplay({
        city: result.city,
        region: result.region,
        country: result.country,
      });

      return {
        confirmationText: `Shared your location as ${locationLabel}.`,
        metadataContext: {
          location: {
            city: result.city,
            region: result.region,
            country: result.country,
          },
        },
        analyticsPayload: {
          location: locationLabel,
        },
      };
  }

  if (isSaveNote(tool)) {
    const saved = await saveLocalNote({
      title: tool.args.title,
      body: tool.args.body,
    });

    return {
      confirmationText: saved.title
        ? `Saved note: "${saved.title}".`
        : "Captured your note.",
      metadataContext: {
        note: {
          id: saved.id,
          title: saved.title,
          createdAt: saved.createdAt,
        },
      },
      analyticsPayload: {
        noteId: saved.id,
      },
    };
  }

  if (isCreateIcsEvent(tool)) {
    const start = new Date(tool.args.start_iso);
    if (Number.isNaN(start.getTime())) {
      throw new ToolExecutionError(
        "The event start time looked off. Try again with a specific date and time.",
        "validation_error",
      );
    }

    const shareResult = await createAndShareIcsEvent({
      title: tool.args.title,
      description: tool.args.description,
      start,
      durationMinutes: tool.args.duration_minutes,
    });

    const windowLabel = formatEventWindow(start, tool.args.duration_minutes);
    const confirmationSuffix = shareResult.shared
      ? ""
      : " Saved the .ics file locally so you can share it later.";

    return {
      confirmationText: `Created a calendar event for ${windowLabel}.${confirmationSuffix}`.trim(),
      metadataContext: {
        event: {
          title: tool.args.title,
          start_iso: tool.args.start_iso,
          duration_minutes: tool.args.duration_minutes,
          shared: shareResult.shared,
        },
      },
      analyticsPayload: {
        shared: shareResult.shared,
      },
    };
  }

  logEvent("chat_tool_unknown", { name: tool.name });
  throw new ToolExecutionError(
    "This suggestion isn't available yet.",
    "not_supported",
  );
}
