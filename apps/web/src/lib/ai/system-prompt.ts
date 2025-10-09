const DEFAULT_SYSTEM_PROMPT = `You are an AI coach. Speak with compassionate candor, focus on practical next steps, and help the user make tangible progress.`;

export function getSystemPrompt(): string {
  return process.env.CHAT_SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT;
}
