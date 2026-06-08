import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-10 w-full rounded-md border border-command-700 bg-command-900 px-3 text-sm text-zinc-100 outline-none transition focus:border-command-copper ${className}`}
      {...props}
    />
  );
}
