"use client";

import { AVATAR_EMOJIS } from "@/lib/emojis";

export default function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {AVATAR_EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onChange(e)}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
            value === e
              ? "border-blue-500 bg-brandsoft ring-2 ring-blue-500/40"
              : "border-linestrong hover:bg-elevated"
          }`}
          aria-label={`Elegir ${e}`}
          aria-pressed={value === e}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
