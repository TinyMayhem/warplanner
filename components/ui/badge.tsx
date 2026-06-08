import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "copper" | "green" | "red" | "neutral";
};

export function Badge({ className = "", tone = "neutral", ...props }: BadgeProps) {
  const tones = {
    copper: "border-command-copper/50 bg-command-copper/15 text-[#f1b06c]",
    green: "border-command-green/50 bg-command-green/15 text-[#a7d1a2]",
    red: "border-command-red/50 bg-command-red/15 text-[#e39490]",
    neutral: "border-command-700 bg-command-900 text-zinc-300"
  };

  return <span className={`inline-flex items-center rounded border px-2 py-1 text-xs font-semibold ${tones[tone]} ${className}`} {...props} />;
}
