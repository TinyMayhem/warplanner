import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full rounded-md border border-command-700 bg-command-900 px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-command-copper ${className}`}
      {...props}
    />
  );
}
