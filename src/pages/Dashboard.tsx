import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { SPECIES_CONFIG, formatAge } from "@/lib/constants";
import { PawPrint, CheckCircle2, Clock, Home, AlertTriangle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Animal = Tables<"animals">;

const STAT_CARDS = [
  { key: "total", label: "Összes állat", icon: PawPrint, accent: "border-l-primary", iconBg: "bg-primary/10 text-primary" },
  { key: "available", label: "Elérhető", icon: CheckCircle2, accent: "border-l-primary", iconBg: "bg-primary/10 text-primary" },
  { key: "reserved", label: "Foglalt", icon: Clock, accent: "border-l-status-reserved", iconBg: "bg-status-reserved-bg text-status-reserved" },
  { key: "adopted", label: "Örökbefogadva", icon: Home, accent: "border-l-status-adopted", iconBg: "bg-status-adopted-bg text-status-adopted" },
] as const;

export default function Dashboard() {
  const { shelterId } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    if (!shelterId) return;
    supabase
      .from("animals")
      .select("*")
      .eq("shelter_id", shelterId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAnimals(data ?? []);
        setLoading(false);
      });
    // Overdue vaccines query
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("animal_vaccinations")
      .select("animal_id, animals!inner(status)")
      .eq("shelter_id", shelterId)
      .lt("next_due_date", today)
      .in("animals.status", ["available", "reserved"])
      .then(({ data }) => {
        const uniqueAnimals = new Set((data ?? []).map((d: any) => d.animal_id));
        setOverdueCount(uniqueAnimals.size);
      });
  }, [shelterId]);

  const counts: Record<string, number> = {
    total: animals.length,
    available: animals.filter(a => a.status === "available").length,
    reserved: animals.filter(a => a.status === "reserved").length,
    adopted: animals.filter(a => a.status === "adopted").length,
  };

  const readyToPost = animals.filter(a => a.is_ready_to_post && !a.fb_post_id).length;
  const recent = animals.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Áttekintés</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.key} className={`rounded-xl shadow-card border-l-4 ${s.accent} hover:shadow-card-hover transition-all duration-200`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{counts[s.key]}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action banners */}
      {readyToPost > 0 && (
        <Link to="/animals?filter=ready" className="block">
          <Card className="rounded-xl border-primary/30 bg-secondary shadow-card hover:shadow-card-hover transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-xl">📘</span>
              <span className="text-sm font-medium text-secondary-foreground">{readyToPost} állat kész a posztolásra</span>
              <span className="ml-auto text-sm text-primary font-medium">Megtekintés →</span>
            </CardContent>
          </Card>
        </Link>
      )}

      {overdueCount > 0 && (
        <Link to="/animals?filter=overdue_vaccine" className="block">
          <Card className="rounded-xl border-amber-300 bg-amber-50 shadow-card hover:shadow-card-hover transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">⚠️ {overdueCount} állatnál lejárt oltás — Ellenőrizd az oltási naplót</span>
              <span className="ml-auto text-sm text-amber-700 font-medium">Megtekintés →</span>
            </CardContent>
          </Card>
        </Link>
      )}

      {animals.length === 0 && (
        <Link to="/import" className="block">
          <Card className="rounded-xl border-primary/30 bg-secondary shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-xl">📂</span>
              <span className="text-sm font-medium text-secondary-foreground">Importálj állatokat a kezdéshez</span>
              <span className="ml-auto text-sm text-primary font-medium">Import →</span>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Recent animals */}
      {recent.length > 0 && (
        <Card className="rounded-xl shadow-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Legutóbbi állatok</CardTitle>
            <Link to="/animals" className="text-sm text-primary font-medium hover:underline">Összes megtekintése →</Link>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {recent.map(a => {
                  const sp = SPECIES_CONFIG[a.species as keyof typeof SPECIES_CONFIG] ?? SPECIES_CONFIG.other;
                  return (
                    <tr key={a.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                      <td className="px-5 py-3">
                        <Link to={`/animals/${a.id}`} className="flex items-center gap-3">
                          <span className="text-lg">{sp.emoji}</span>
                          <span className="font-medium">{a.name}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{sp.label} · {formatAge(a.date_of_birth, a.age_years)}</td>
                      <td className="px-3 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-3 py-3 text-muted-foreground text-xs">
                        {a.created_at ? new Date(a.created_at).toLocaleDateString("hu-HU") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
