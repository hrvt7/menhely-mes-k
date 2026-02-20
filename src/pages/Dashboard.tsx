import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { SPECIES_CONFIG, formatAge } from "@/lib/constants";
import { PawPrint, CheckCircle2, Clock, Home, AlertTriangle, Plus, Upload, Sparkles, Syringe, Share2, CalendarDays, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Animal = Tables<"animals">;

const STAT_CARDS = [
  { key: "total", label: "Összes állat", icon: PawPrint, accent: "border-l-primary", iconBg: "bg-secondary text-primary" },
  { key: "available", label: "Elérhető", icon: CheckCircle2, accent: "border-l-primary", iconBg: "bg-secondary text-primary" },
  { key: "reserved", label: "Foglalt", icon: Clock, accent: "border-l-status-reserved", iconBg: "bg-status-reserved-bg text-status-reserved" },
  { key: "adopted", label: "Örökbefogadva", icon: Home, accent: "border-l-status-adopted", iconBg: "bg-status-adopted-bg text-status-adopted" },
] as const;

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Ma";
  if (days === 1) return "Tegnap";
  if (days < 7) return `${days} napja`;
  if (days < 30) return `${Math.floor(days / 7)} hete`;
  if (days < 365) return `${Math.floor(days / 30)} hónapja`;
  return `${Math.floor(days / 365)} éve`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Jó reggelt";
  if (h < 18) return "Jó napot";
  return "Jó estét";
}

export default function Dashboard() {
  const { shelterId, shelterInfo } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [overdueCount, setOverdueCount] = useState(0);
  const [vaxMap, setVaxMap] = useState<Record<string, { status: "ok" | "soon" | "overdue"; date?: string }>>({});

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
    // Fetch all vaccinations for per-animal status
    supabase
      .from("animal_vaccinations")
      .select("animal_id, next_due_date")
      .eq("shelter_id", shelterId)
      .then(({ data }) => {
        const map: Record<string, { status: "ok" | "soon" | "overdue"; date?: string }> = {};
        const today = new Date();
        const soon30 = new Date();
        soon30.setDate(soon30.getDate() + 30);
        let overdueSet = new Set<string>();

        (data ?? []).forEach((v: any) => {
          const aid = v.animal_id;
          if (!v.next_due_date) {
            if (!map[aid]) map[aid] = { status: "ok" };
            return;
          }
          const due = new Date(v.next_due_date);
          if (due < today) {
            map[aid] = { status: "overdue", date: v.next_due_date };
            overdueSet.add(aid);
          } else if (due <= soon30) {
            if (map[aid]?.status !== "overdue") {
              map[aid] = { status: "soon", date: v.next_due_date };
            }
          } else {
            if (!map[aid]) map[aid] = { status: "ok" };
          }
        });
        setVaxMap(map);
        setOverdueCount(overdueSet.size);
      });
  }, [shelterId]);

  const counts: Record<string, number> = {
    total: animals.length,
    available: animals.filter(a => a.status === "available").length,
    reserved: animals.filter(a => a.status === "reserved").length,
    adopted: animals.filter(a => a.status === "adopted").length,
  };

  const readyToPost = animals.filter(a => a.is_ready_to_post && !a.fb_post_id).length;
  const longResidents = animals.filter(a => {
    if (a.status === "adopted") return false;
    if (!a.created_at) return false;
    const days = Math.floor((Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return days > 30;
  }).length;
  const recent = animals.slice(0, 10);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()}, {shelterInfo?.name ?? "ShelterOps"}! 👋
        </h1>
        <p className="text-sm text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.key} className={`rounded-xl shadow-card border-l-4 ${s.accent} hover:shadow-card-hover hover:-translate-y-px transition-all duration-150`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold tracking-tight">{counts[s.key]}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link to="/animals">
          <Button variant="outline" size="sm" className="rounded-lg gap-2 text-sm">
            <Plus className="h-4 w-4" /> Új állat
          </Button>
        </Link>
        <Link to="/import">
          <Button variant="outline" size="sm" className="rounded-lg gap-2 text-sm">
            <Upload className="h-4 w-4" /> Import
          </Button>
        </Link>
      </div>

      {/* Alert banners */}
      {overdueCount > 0 && (
        <Link to="/animals?filter=overdue_vaccine" className="block">
          <Card className="rounded-xl border-amber-200 bg-amber-50 shadow-card hover:shadow-card-hover transition-all duration-150">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <span className="text-sm font-medium text-amber-800">{overdueCount} állatnál lejárt oltás — Ellenőrizd az oltási naplót</span>
              <ChevronRight className="ml-auto h-4 w-4 text-amber-600" />
            </CardContent>
          </Card>
        </Link>
      )}

      {readyToPost > 0 && (
        <Link to="/animals?filter=ready" className="block">
          <Card className="rounded-xl border-primary/20 bg-secondary shadow-card hover:shadow-card-hover transition-all duration-150">
            <CardContent className="p-4 flex items-center gap-3">
              <Share2 className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm font-medium text-secondary-foreground">{readyToPost} állat kész a posztolásra</span>
              <ChevronRight className="ml-auto h-4 w-4 text-primary" />
            </CardContent>
          </Card>
        </Link>
      )}

      {animals.length === 0 && (
        <Link to="/import" className="block">
          <Card className="rounded-xl border-primary/20 bg-secondary shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <Upload className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm font-medium text-secondary-foreground">Importálj állatokat a kezdéshez</span>
              <ChevronRight className="ml-auto h-4 w-4 text-primary" />
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Recent animals table */}
        {recent.length > 0 && (
          <Card className="rounded-xl shadow-card overflow-hidden xl:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Legutóbbi állatok</CardTitle>
              <Link to="/animals" className="text-sm text-primary font-medium hover:underline">Összes →</Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-accent/50">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Állat</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faj / Kor</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Státusz</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Befogadva</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Oltás</th>
                      <th className="px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(a => {
                      const sp = SPECIES_CONFIG[a.species as keyof typeof SPECIES_CONFIG] ?? SPECIES_CONFIG.other;
                      return (
                        <tr key={a.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <Link to={`/animals/${a.id}`} className="flex items-center gap-3">
                              <span className="text-lg">{sp.emoji}</span>
                              <div>
                                <p className="font-medium text-foreground">{a.name}</p>
                                {a.chip_id && <p className="font-mono text-xs text-muted-foreground">{a.chip_id}</p>}
                              </div>
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{sp.label} · {formatAge(a.date_of_birth, a.age_years)}</td>
                          <td className="px-3 py-3"><StatusBadge status={a.status} /></td>
                          <td className="px-3 py-3 text-muted-foreground text-xs">{relativeDate(a.created_at)}</td>
                          <td className="px-3 py-3"><VaxStatusCell animalId={a.id} vaxMap={vaxMap} /></td>
                          <td className="px-3 py-3">
                            <Link to={`/animals/${a.id}`}><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks widget */}
        <Card className="rounded-xl shadow-card xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Teendők</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-4 w-4 text-amber-500" />
                <span className="text-sm">Lejárt oltások</span>
              </div>
              <span className={`text-sm font-semibold ${overdueCount > 0 ? "text-amber-600" : "text-muted-foreground"}`}>{overdueCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" />
                <span className="text-sm">Posztolásra kész</span>
              </div>
              <span className={`text-sm font-semibold ${readyToPost > 0 ? "text-primary" : "text-muted-foreground"}`}>{readyToPost}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">30+ napos bentlakó</span>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">{longResidents}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function VaxStatusCell({ animalId, vaxMap }: { animalId: string; vaxMap: Record<string, { status: "ok" | "soon" | "overdue"; date?: string }> }) {
  const entry = vaxMap[animalId];
  if (!entry) return <span className="text-muted-foreground">–</span>;
  if (entry.status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Lejárt
      </span>
    );
  }
  if (entry.status === "soon") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Hamarosan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Rendben
    </span>
  );
}
