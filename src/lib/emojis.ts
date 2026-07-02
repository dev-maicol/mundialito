// Conjunto de emojis disponibles como avatar/insignia.
export const AVATAR_EMOJIS = [
  "⚽", "🏆", "🔥", "⭐", "🦁", "🐯", "🐉", "🦅",
  "🐺", "🦊", "🐸", "🐵", "🚀", "⚡", "💎", "👑",
  "🎯", "🎲", "🥇", "🍀", "🌟", "💪", "🧠", "😎",
  "🤖", "👽", "🦈", "🐍", "🐂", "🐎", "🦘", "🐧",
] as const;

export const DEFAULT_EMOJI = "⚽";

export function isValidEmoji(value: string): boolean {
  return (AVATAR_EMOJIS as readonly string[]).includes(value);
}
