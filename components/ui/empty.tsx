import * as React from "react";
import { cn } from "@/lib/utils";

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty" className={cn(
    "flex w-full flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-5 py-10 text-center sm:px-8 sm:py-12",
    className,
  )} {...props} />;
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-header" className={cn("flex max-w-sm flex-col items-center gap-2", className)} {...props} />;
}

function EmptyMedia({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-media" aria-hidden="true" className={cn(
    "mb-2 flex size-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm [&_svg]:size-6",
    className,
  )} {...props} />;
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-title" className={cn("text-base font-semibold tracking-tight text-slate-900", className)} {...props} />;
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="empty-description" className={cn("text-sm leading-relaxed text-slate-600", className)} {...props} />;
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-content" className={cn("flex flex-wrap items-center justify-center gap-2", className)} {...props} />;
}

export { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent };
