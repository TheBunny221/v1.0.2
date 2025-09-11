import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  Users,
  Settings,
  CheckCircle,
  RotateCcw,
  FileText,
} from "lucide-react";

/**
 * Drop-in replacement for the existing status cards grid.
 * - Cleaner, consistent styling
 * - Better accessibility (keyboard + ARIA)
 * - Single source of truth via metadata map
 * - No spooky color clashes; subtle accents when selected
 *
 * Usage:
 * <StatusOverviewGrid
 *   stats={stats}
 *   filters={filters}
 *   onMainFilterChange={handleMainFilterChange}
 * />
 */

// Types (adjust if you already have them defined elsewhere)
export type StatusId =
  | "registered"
  | "assigned"
  | "inProgress"
  | "resolved"
  | "reopened"
  | "closed"
  | "none";

interface Filters {
  mainFilter: StatusId;
}

interface Stats {
  statusBreakdown?: Partial<
    Record<
      | "registered"
      | "assigned"
      | "in_progress"
      | "resolved"
      | "reopened"
      | "closed",
      number
    >
  >;
}

// Style tokens per status (avoid dynamic tailwind class strings)
const STYLE: Record<
  Exclude<StatusId, "none">,
  {
    ring: string; // ring color when active
    text: string; // number color when active
    textSoft: string; // icon color when active
    bgSoft: string; // subtle bg when active
    chipRing: string; // ring for icon chip
  }
> = {
  registered: {
    ring: "ring-amber-500",
    text: "text-amber-700",
    textSoft: "text-amber-600",
    bgSoft: "bg-amber-50",
    chipRing: "ring-amber-200",
  },
  assigned: {
    ring: "ring-indigo-500",
    text: "text-indigo-700",
    textSoft: "text-indigo-600",
    bgSoft: "bg-indigo-50",
    chipRing: "ring-indigo-200",
  },
  inProgress: {
    ring: "ring-orange-500",
    text: "text-orange-700",
    textSoft: "text-orange-600",
    bgSoft: "bg-orange-50",
    chipRing: "ring-orange-200",
  },
  resolved: {
    ring: "ring-emerald-500",
    text: "text-emerald-700",
    textSoft: "text-emerald-600",
    bgSoft: "bg-emerald-50",
    chipRing: "ring-emerald-200",
  },
  reopened: {
    ring: "ring-violet-500",
    text: "text-violet-700",
    textSoft: "text-violet-600",
    bgSoft: "bg-violet-50",
    chipRing: "ring-violet-200",
  },
  closed: {
    ring: "ring-slate-500",
    text: "text-slate-700",
    textSoft: "text-slate-600",
    bgSoft: "bg-slate-50",
    chipRing: "ring-slate-200",
  },
};

const META = [
  {
    id: "registered" as const,
    label: "Registered",
    subtitle: "Newly registered",
    icon: Clock,
    valueKey: "registered" as const,
  },
  {
    id: "assigned" as const,
    label: "Assigned",
    subtitle: "Assigned to teams",
    icon: Users,
    valueKey: "assigned" as const,
  },
  {
    id: "inProgress" as const,
    label: "In Progress",
    subtitle: "Active work",
    icon: Settings,
    valueKey: "in_progress" as const, // NOTE: backend uses snake_case here
  },
  {
    id: "resolved" as const,
    label: "Resolved",
    subtitle: "Resolved complaints",
    icon: CheckCircle,
    valueKey: "resolved" as const,
  },
  {
    id: "reopened" as const,
    label: "Reopened",
    subtitle: "Reopened after closure",
    icon: RotateCcw,
    valueKey: "reopened" as const,
  },
  {
    id: "closed" as const,
    label: "Closed",
    subtitle: "Closed complaints",
    icon: FileText,
    valueKey: "closed" as const,
  },
];

export default function StatusOverviewGrid({
  stats,
  filters,
  onMainFilterChange,
}: {
  stats?: Stats;
  filters: Filters;
  onMainFilterChange: (next: StatusId) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-3 sm:gap-4">
      {META.map((m) => {
        const active = filters.mainFilter === m.id;
        const style = STYLE[m.id];
        const value = stats?.statusBreakdown?.[m.valueKey] ?? 0;

        return (
          <Card
            key={m.id}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`${m.label}, ${value}`}
            onClick={() => onMainFilterChange(active ? "none" : m.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onMainFilterChange(active ? "none" : m.id);
              }
            }}
            className={[
              "group relative cursor-pointer select-none rounded-2xl border bg-white shadow-sm transition-all",
              "hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              active
                ? `ring-2 ${style.ring} ${style.bgSoft} border-transparent`
                : "hover:border-neutral-200",
            ].join(" ")}
          >
            {/* Subtle decorative highlight */}
            <div
              className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-30"
              style={{
                background:
                  "radial-gradient(40% 40% at 50% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 70%)",
              }}
            />

            <CardHeader className="flex flex-col items-center justify-center p-3 pb-1">
              <div
                className={[
                  "mb-2 grid h-10 w-10 place-items-center rounded-full ring-1 ring-inset",
                  active
                    ? `${style.bgSoft} ${style.textSoft} ${style.chipRing}`
                    : "bg-neutral-50 text-neutral-600 ring-neutral-200",
                ].join(" ")}
              >
                <m.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-semibold text-neutral-800">
                {m.label}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center p-2 pt-0">
              <div
                className={[
                  "text-2xl font-bold leading-none tracking-tight",
                  active ? style.text : "text-neutral-900",
                ].join(" ")}
              >
                {value}
              </div>
              <p className="mt-1 text-xs text-neutral-500">{m.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
