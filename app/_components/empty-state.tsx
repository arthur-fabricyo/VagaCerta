import type { ReactNode } from "react";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  compact?: boolean;
  status?: boolean;
};

export function EmptyState({ icon, title, description, children, compact = false, status = false }: EmptyStateProps) {
  return (
    <Empty role={status ? "status" : undefined} className={compact ? "gap-3 px-4 py-6 sm:py-6" : undefined}>
      <EmptyHeader>
        <EmptyMedia>{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  );
}
