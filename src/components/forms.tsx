"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
};

export function Field({ label, name, error, hint, id, ...input }: FieldProps) {
  const inputId = id ?? name;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[14px] font-semibold text-ink">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="h-12 w-full rounded-control bg-surface px-4 text-[16px] text-ink ring-1 ring-ink/20 transition-shadow duration-150 outline-none placeholder:text-ink-soft hover:ring-ink/35 focus-visible:ring-2 focus-visible:ring-route-deep focus-visible:outline-none aria-invalid:ring-2 aria-invalid:ring-brand"
        {...input}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-[13.5px] font-medium text-brand-deep">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-[13px] text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({ children, pendingLabel }: { children: ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="press inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-control bg-route px-6 text-[15px] font-bold text-ink hover:bg-route-deep disabled:cursor-progress disabled:opacity-70"
    >
      {pending ? (
        <>
          <LoaderCircle aria-hidden className="size-[18px] animate-spin motion-reduce:animate-none" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-control bg-brand/[0.08] px-4 py-3 text-[14px] font-medium text-brand-deep">
      {message}
    </p>
  );
}
