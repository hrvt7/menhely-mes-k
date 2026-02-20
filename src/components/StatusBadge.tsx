import { STATUS_CONFIG, type AnimalStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as AnimalStatus] ?? STATUS_CONFIG.available;
  return (
    <Badge variant="outline" className={`${config.colorClass} border-0 font-medium text-xs`}>
      {config.emoji} {config.label}
    </Badge>
  );
}
