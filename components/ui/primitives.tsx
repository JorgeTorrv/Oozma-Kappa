import * as React from "react";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------- Card */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />
  );
}
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-semibold text-slate-900", className)}
      {...props}
    />
  );
}
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-500", className)} {...props} />;
}
export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-2 p-5 pt-0", className)}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------- Input */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-base shadow-sm transition-colors placeholder:text-slate-400 focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:text-sm",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

/* ------------------------------------------------------------- Textarea */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[72px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base shadow-sm placeholder:text-slate-400 focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/* --------------------------------------------------------------- Select */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-base shadow-sm focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:text-sm",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

/* ---------------------------------------------------------------- Label */
export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-sm font-medium text-slate-700 leading-none",
        className,
      )}
      {...props}
    />
  );
}

/** Campo con etiqueta + área de error accesible. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[] | string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const errText = Array.isArray(error) ? error.join(" ") : error;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      {children}
      {hint && !errText && <p className="text-xs text-slate-500">{hint}</p>}
      {errText && (
        <p id={`${htmlFor}-error`} className="text-xs text-red-600">
          {errText}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Badge */
const badgeColors: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
};

export function Badge({
  color = "slate",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: keyof typeof badgeColors }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        badgeColors[color],
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------ Separator */
export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-slate-200", className)} />;
}

/* ---------------------------------------------------------- Skeleton */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />
  );
}
