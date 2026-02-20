import { STATUS_CONFIG, type AnimalStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

const BADGE_STYLES: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  adopted: "bg-blue-50 text-blue-700 border-blue-200",
  on_hold: "bg-gray-50 text-gray-600 border-gray-200",
};

const DOT_COLORS: Record<string, string> = {
  available: "bg-emerald-500",
  reserved: "bg-amber-500",
  adopted: "bg-blue-500",
  on_hold: "bg-gray-400",
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as AnimalStatus] ?? STATUS_CONFIG.available;
  return (
    <Badge variant="outline" className={`${BADGE_STYLES[status] ?? BADGE_STYLES.available} border font-medium text-xs gap-1.5`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${DOT_COLORS[status] ?? "bg-gray-400"}`} />
      {config.label}
    </Badge>
  );
}
