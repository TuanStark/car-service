import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { ROUTES } from "@/config/routes.config";

export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

export function Breadcrumbs({
  items,
}: {
  readonly items: readonly BreadcrumbItem[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-line bg-surface"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 text-xs text-ink-secondary sm:px-6 lg:px-8">
        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center gap-1.5 text-ink-secondary transition-colors hover:text-brand"
        >
          <Home className="h-3.5 w-3.5 text-brand" />
          <span>Trang chủ</span>
        </Link>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={`${item.label}-${idx}`}>
              <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-brand"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-semibold text-ink line-clamp-1">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
