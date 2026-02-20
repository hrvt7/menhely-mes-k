import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { SPECIES_CONFIG, formatAge } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

type Animal = Tables<"animals">;

export default function Dashboard() {
  const { shelterId } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [shelterId]);

  const counts = {
    total: animals.length,
    available: animals.filter(a => a.status === "available").length,
    reserved: animals.filter(a => a.status === "reserved").length,
    adopted: animals.filter(a => a.status === "adopted").length,
  };

  const readyToPost = animals.filter(a => a.is_ready_to_post && !a.fb_post_id).length;
  const recent = animals.slice(0, 5);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Áttekintés</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { emoji: "🐾", count: counts.total, label: "Összes állat" },
          { emoji: "✅", count: counts.available, label: "Elérhető" },
          { emoji: "⏳", count: counts.reserved, label: "Foglalt" },
          { emoji: "🏠", count: counts.adopted, label: "Örökbefogadva" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.emoji}</span>
                <div>
                  <p className="text-2xl font-semibold">{s.count}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action banners */}
      {readyToPost > 0 && (
        <Link to="/animals?filter=ready" className="block">
          <Card className="border-primary/30 bg-secondary">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-xl">📘</span>
              <span className="text-sm font-medium text-secondary-foreground">{readyToPost} állat kész a posztolásra</span>
              <span className="ml-auto text-sm text-primary">Megtekintés →</span>
            </CardContent>
          </Card>
        </Link>
      )}

      {animals.length === 0 && (
        <Link to="/import" className="block">
          <Card className="border-primary/30 bg-secondary">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-xl">📂</span>
              <span className="text-sm font-medium text-secondary-foreground">Importálj állatokat a kezdéshez</span>
              <span className="ml-auto text-sm text-primary">Import →</span>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Recent animals */}
      {recent.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-medium">Legutóbbi állatok</CardTitle>
            <Link to="/animals" className="text-sm text-primary hover:underline">Összes megtekintése →</Link>
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
                      <td className="px-3 py-3">{sp.label} · {formatAge(a.date_of_birth, a.age_years)}</td>
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
