/**
 * Minimal UI primitives for operator console pages.
 * Swap for full design system later without changing page imports.
 */
import React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode };
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode };
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Card({ children, className = "", ...rest }: DivProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Button({ children, className = "", ...rest }: BtnProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Input({ className = "", ...rest }: InputProps) {
  return (
    <input
      className={`w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 ${className}`}
      {...rest}
    />
  );
}

export function Badge({ children, className = "", ...rest }: DivProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-mono text-emerald-200 ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
