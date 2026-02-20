import { STATUS_CONFIG, type AnimalStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

const DOT_COLORS: Record<string, string> = {
  available: "bg-status-available",
  reserved: "bg-status-reserved",
  adopted: "bg-status-adopted",
  on_hold: "bg-status-on-hold",
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as AnimalStatus] ?? STATUS_CONFIG.available;
  return (
    <Badge variant="outline" className={`${config.colorClass} border-0 font-medium text-xs gap-1.5`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${DOT_COLORS[status] ?? "bg-muted"}`} />
      {config.label}
    </Badge>
  );
}
