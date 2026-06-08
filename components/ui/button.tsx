import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "border-command-copper/70 bg-command-copper text-command-950 hover:bg-[#de8b42]",
    secondary: "border-command-700 bg-command-800 text-zinc-100 hover:bg-command-700",
    danger: "border-command-red/70 bg-command-red text-white hover:bg-[#c76b66]",
    ghost: "border-transparent bg-transparent text-zinc-300 hover:bg-command-800"
  };

  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
