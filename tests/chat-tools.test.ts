import { describe, expect, it } from 'vitest';

import { extractToolCallFromMessage } from '@/app/api/chat/utils';

describe('extractToolCallFromMessage', () => {
  it('returns null toolCall when no tool block is present', () => {
    const result = extractToolCallFromMessage('Here is a normal message.');
    expect(result.cleanedText).toBe('Here is a normal message.');
    expect(result.toolCall).toBeNull();
  });

  it('parses schedule_reminder tool block and strips it from the message', () => {
    const message = `Let me set that up for you.
\`\`\`tool
{ "name": "schedule_reminder", "args": { "iso_datetime": "2025-10-27T15:00:00-07:00", "title": "Check-in", "body": "How are you feeling?" } }
\`\`\`
Once you confirm I will remind you.`;

    const result = extractToolCallFromMessage(message);

    expect(result.cleanedText).toBe('Let me set that up for you.\n\nOnce you confirm I will remind you.');
    expect(result.toolCall).not.toBeNull();
    expect(result.toolCall?.name).toBe('schedule_reminder');
    expect(result.toolCall?.validation.valid).toBe(true);
    expect(result.toolCall?.args).toEqual({
      iso_datetime: '2025-10-27T15:00:00-07:00',
      title: 'Check-in',
      body: 'How are you feeling?',
    });
  });

  it('flags invalid tool payloads with validation issues', () => {
    const message = `I'll try to do that for you.
\`\`\`tool
{ "name": "schedule_reminder", "args": { "title": "Missing datetime" } }
\`\`\``;

    const result = extractToolCallFromMessage(message);

    expect(result.cleanedText).toBe("I'll try to do that for you.");
    expect(result.toolCall).not.toBeNull();
    expect(result.toolCall?.validation.valid).toBe(false);
    expect(result.toolCall?.validation.issues).toBeDefined();
    expect(result.toolCall?.validation.issues?.length ?? 0).toBeGreaterThan(0);
  });

  it('parses start_timer tool call with validated args', () => {
    const message = `Set a quick focus timer.
\`\`\`tool
{ "name": "start_timer", "args": { "duration_seconds": 600, "label": "Deep work" } }
\`\`\`
Tell me when it is done.`;

    const result = extractToolCallFromMessage(message);

    expect(result.cleanedText).toBe('Set a quick focus timer.\n\nTell me when it is done.');
    expect(result.toolCall?.name).toBe('start_timer');
    expect(result.toolCall?.validation.valid).toBe(true);
    expect(result.toolCall?.args).toEqual({
      duration_seconds: 600,
      label: 'Deep work',
    });
  });

  it('reports unsupported tool names as invalid', () => {
    const message = `I cannot run that directly.
\`\`\`tool
{ "name": "launch_drone", "args": { "target": "backyard" } }
\`\`\``;

    const result = extractToolCallFromMessage(message);

    expect(result.toolCall?.validation.valid).toBe(false);
    expect(result.toolCall?.validation.issues).toEqual(['Unsupported tool name "launch_drone".']);
  });

  it('handles malformed JSON payloads gracefully', () => {
    const message = `Let me try.
\`\`\`tool
{ "name": "schedule_reminder", "args": { "iso_datetime": "2025-10-27T15:00:00-07:00"  // missing closing brace
\`\`\``;

    const result = extractToolCallFromMessage(message);

    expect(result.toolCall?.validation.valid).toBe(false);
    expect(result.toolCall?.validation.issues).toEqual(['Invalid JSON in tool block']);
  });

  it('only considers the first tool block in a message', () => {
    const message = `First block
\`\`\`tool
{ "name": "get_location", "args": { "granularity": "city" } }
\`\`\`
Second block
\`\`\`tool
{ "name": "schedule_reminder", "args": { "iso_datetime": "2025-10-27T15:00:00-07:00", "title": "Later", "body": "Heads up" } }
\`\`\``;

    const result = extractToolCallFromMessage(message);

    expect(result.toolCall?.name).toBe('get_location');
    expect(result.cleanedText.startsWith('First block\n\nSecond block')).toBe(true);
    expect(result.cleanedText.includes('schedule_reminder')).toBe(true);
  });
});
