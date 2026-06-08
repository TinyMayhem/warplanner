import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-lg border border-command-700 bg-command-850 shadow-panel ${className}`} {...props} />;
}
