import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SPECIES_CONFIG, STATUS_CONFIG, formatAge } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, Users, Heart, TrendingUp, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Animal = Tables<"animals">;

const MONTHS_HU = ["Jan", "Feb", "Már", "Ápr", "Máj", "Jún", "Júl", "Aug", "Szep", "Okt", "Nov", "Dec"];
const PIE_COLORS = ["hsl(142, 72%, 29%)", "hsl(224, 76%, 48%)", "hsl(33, 96%, 37%)", "hsl(220, 9%, 46%)"];

export default function Reports() {
  const { shelterId } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [allAnimals, setAllAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shelterId) return;
    Promise.all([
      supabase.from("animals").select("*").eq("shelter_id", shelterId),
      supabase.from("animals").select("*").eq("shelter_id", shelterId).gte("created_at", `${year}-01-01`).lt("created_at", `${Number(year) + 1}-01-01`),
    ]).then(([allRes, yearRes]) => {
      setAllAnimals(allRes.data ?? []);
      setAnimals(yearRes.data ?? []);
      setLoading(false);
    });
  }, [shelterId, year]);

  const stats = useMemo(() => {
    const total = animals.length;
    const adopted = animals.filter(a => a.status === "adopted" && a.adopted_at && a.adopted_at.startsWith(year)).length;
    const rate = total > 0 ? Math.round((adopted / total) * 100) : 0;

    const adoptedAnimals = animals.filter(a => a.status === "adopted" && a.adopted_at && a.created_at);
    const avgDays = adoptedAnimals.length > 0
      ? Math.round(adoptedAnimals.reduce((sum, a) => {
          const d = (new Date(a.adopted_at!).getTime() - new Date(a.created_at!).getTime()) / (1000 * 60 * 60 * 24);
          return sum + d;
        }, 0) / adoptedAnimals.length)
      : 0;

    return { total, adopted, rate, avgDays };
  }, [animals, year]);

  const monthlyData = useMemo(() => {
    return MONTHS_HU.map((m, i) => {
      const intake = animals.filter(a => a.created_at && new Date(a.created_at).getMonth() === i).length;
      const adopted = animals.filter(a => a.adopted_at && a.adopted_at.startsWith(year) && new Date(a.adopted_at).getMonth() === i).length;
      return { name: m, Befogadott: intake, Örökbeadott: adopted };
    });
  }, [animals, year]);

  const speciesData = useMemo(() => {
    const counts: Record<string, number> = {};
    allAnimals.forEach(a => {
      const label = SPECIES_CONFIG[a.species as keyof typeof SPECIES_CONFIG]?.label ?? "Egyéb";
      counts[label] = (counts[label] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allAnimals]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    allAnimals.forEach(a => {
      const label = STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG]?.label ?? a.status;
      counts[label] = (counts[label] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allAnimals]);

  const longestResidents = useMemo(() => {
    const now = new Date().getTime();
    return allAnimals
      .filter(a => a.status !== "adopted" && a.created_at)
      .map(a => ({ ...a, days: Math.floor((now - new Date(a.created_at!).getTime()) / (1000 * 60 * 60 * 24)) }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);
  }, [allAnimals]);

  const recentAdoptions = useMemo(() => {
    return allAnimals
      .filter(a => a.status === "adopted" && a.adopted_at)
      .sort((a, b) => new Date(b.adopted_at!).getTime() - new Date(a.adopted_at!).getTime())
      .slice(0, 5);
  }, [allAnimals]);

  const handleExport = () => {
    const rows = animals.map(a => ({
      Név: a.name,
      Faj: SPECIES_CONFIG[a.species as keyof typeof SPECIES_CONFIG]?.label ?? a.species,
      Nem: a.sex ?? "",
      Kor: formatAge(a.date_of_birth, a.age_years),
      Befogadva: a.created_at ? new Date(a.created_at).toLocaleDateString("hu-HU") : "",
      Örökbeadva: a.adopted_at ? new Date(a.adopted_at).toLocaleDateString("hu-HU") : "",
      "Bentlakási napok": a.created_at ? Math.floor((new Date(a.adopted_at ?? Date.now()).getTime() - new Date(a.created_at).getTime()) / (1000*60*60*24)) : "",
      Státusz: STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG]?.label ?? a.status,
    }));
    const header = Object.keys(rows[0] ?? {}).join(",");
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shelterops-riport-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const STAT_CARDS = [
    { label: "Befogadott", value: stats.total, icon: Users, accent: "border-l-primary", iconBg: "bg-primary/10 text-primary" },
    { label: "Örökbeadott", value: stats.adopted, icon: Heart, accent: "border-l-status-adopted", iconBg: "bg-status-adopted-bg text-status-adopted" },
    { label: "Örökbeadási arány", value: `${stats.rate}%`, icon: TrendingUp, accent: "border-l-primary", iconBg: "bg-primary/10 text-primary", ring: stats.rate },
    { label: "Átl. bentlakás", value: `${stats.avgDays} nap`, icon: Clock, accent: "border-l-status-reserved", iconBg: "bg-status-reserved-bg text-status-reserved" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Riportok</h1>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 4 }, (_, i) => String(currentYear - i)).map(y => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`rounded-xl shadow-card border-l-4 ${s.accent} hover:shadow-card-hover transition-all`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly chart */}
      <Card className="rounded-xl shadow-card">
        <CardHeader><CardTitle className="text-base font-semibold">Havi bontás — {year}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="Befogadott" fill="hsl(142, 72%, 29%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Örökbeadott" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-card">
          <CardHeader><CardTitle className="text-base font-semibold">Fajta megoszlás</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={speciesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {speciesData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-card">
          <CardHeader><CardTitle className="text-base font-semibold">Státusz megoszlás</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-card">
          <CardHeader><CardTitle className="text-base font-semibold">Leghosszabb bentlakók</CardTitle></CardHeader>
          <CardContent>
            {longestResidents.length === 0 ? <p className="text-sm text-muted-foreground">Nincs adat</p> : (
              <div className="space-y-3">
                {longestResidents.map(a => {
                  const sp = SPECIES_CONFIG[a.species as keyof typeof SPECIES_CONFIG] ?? SPECIES_CONFIG.other;
                  return (
                    <div key={a.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{sp.emoji}</span>
                        <span className="text-sm font-medium">{a.name}</span>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium">{a.days} nap</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-card">
          <CardHeader><CardTitle className="text-base font-semibold">Legutóbbi örökbeadások</CardTitle></CardHeader>
          <CardContent>
            {recentAdoptions.length === 0 ? <p className="text-sm text-muted-foreground">Nincs adat</p> : (
              <div className="space-y-3">
                {recentAdoptions.map(a => (
                  <div key={a.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.adopted_at ? new Date(a.adopted_at).toLocaleDateString("hu-HU") : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <Card className="rounded-xl shadow-card">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="font-semibold">Éves riport exportálása</p>
            <p className="text-sm text-muted-foreground">{year} — {animals.length} állat</p>
          </div>
          <Button onClick={handleExport} className="gap-2 rounded-lg" disabled={animals.length === 0}>
            <Download className="h-4 w-4" /> CSV letöltés
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
