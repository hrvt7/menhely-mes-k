import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { SPECIES_CONFIG, STATUS_CONFIG, formatAge, type AnimalStatus, type Species } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, PawPrint, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Animal = Tables<"animals">;

const STATUS_PILLS: { value: string; label: string }[] = [
  { value: "all", label: "Mind" },
  { value: "available", label: "Elérhető" },
  { value: "reserved", label: "Foglalt" },
  { value: "adopted", label: "Örökbefogadva" },
  { value: "on_hold", label: "Várakozás" },
];

const SPECIES_PILLS: { value: string; label: string }[] = [
  { value: "all", label: "Mind" },
  { value: "dog", label: "🐕 Kutya" },
  { value: "cat", label: "🐈 Macska" },
  { value: "other", label: "🐾 Egyéb" },
];

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Ma";
  if (days === 1) return "Tegnap";
  if (days < 7) return `${days} napja`;
  if (days < 30) return `${Math.floor(days / 7)} hete`;
  return `${Math.floor(days / 30)} hónapja`;
}

export default function Animals() {
  const { shelterId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const filterParam = searchParams.get("filter");
  const [statusFilter, setStatusFilter] = useState<string>(filterParam === "ready" ? "available" : "all");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [overdueAnimalIds, setOverdueAnimalIds] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({ name: "", species: "dog", sex: "unknown", size: "medium", age_years: "", chip_id: "", breed_hint: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchAnimals = async () => {
    if (!shelterId) return;
    const { data } = await supabase
      .from("animals")
      .select("*")
      .eq("shelter_id", shelterId)
      .order("created_at", { ascending: false });
    setAnimals(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAnimals(); }, [shelterId]);

  useEffect(() => {
    if (!shelterId) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("animal_vaccinations")
      .select("animal_id")
      .eq("shelter_id", shelterId)
      .lt("next_due_date", today)
      .then(({ data }) => {
        setOverdueAnimalIds(new Set((data ?? []).map(d => d.animal_id)));
      });
  }, [shelterId]);

  const filtered = animals.filter(a => {
    if (filterParam === "overdue_vaccine" && !overdueAnimalIds.has(a.id)) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (speciesFilter !== "all" && a.species !== speciesFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.name.toLowerCase().includes(q) && !(a.chip_id ?? "").toLowerCase().includes(q) && !(a.breed_hint ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelterId) return;
    setSubmitting(true);
    const { error } = await supabase.from("animals").insert({
      shelter_id: shelterId,
      name: form.name,
      species: form.species,
      sex: form.sex,
      size: form.size,
      age_years: form.age_years ? Number(form.age_years) : null,
      chip_id: form.chip_id || null,
      breed_hint: form.breed_hint || null,
      notes: form.notes || null,
    });
    if (error) {
      toast({ title: "Hiba", description: "Nem sikerült hozzáadni.", variant: "destructive" });
    } else {
      toast({ title: "Állat hozzáadva!" });
      setModalOpen(false);
      setForm({ name: "", species: "dog", sex: "unknown", size: "medium", age_years: "", chip_id: "", breed_hint: "", notes: "" });
      fetchAnimals();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="flex gap-3"><Skeleton className="h-10 w-64" /><Skeleton className="h-8 w-80" /></div>
        <Card className="rounded-xl shadow-card overflow-hidden">
          <div className="p-0">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 mx-5 my-2 rounded-lg" />)}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Állatok</h1>
          <p className="text-sm text-muted-foreground">{animals.length} állat</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 rounded-lg"><Plus className="h-4 w-4" /> Új állat</Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Keresés név, chip, fajta..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-lg" />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_PILLS.map(p => (
            <button
              key={p.value}
              onClick={() => setStatusFilter(p.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                statusFilter === p.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground border border-border hover:bg-accent"
              }`}
            >
              {p.label}
            </button>
          ))}
          <span className="w-px bg-border mx-1" />
          {SPECIES_PILLS.map(p => (
            <button
              key={p.value}
              onClick={() => setSpeciesFilter(p.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                speciesFilter === p.value
                  ? "bg-foreground text-card shadow-sm"
                  : "bg-card text-muted-foreground border border-border hover:bg-accent"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card className="rounded-xl shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PawPrint className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground mb-3">Nincs találat</p>
            {animals.length === 0 && (
              <Link to="/import"><Button variant="outline" className="rounded-lg">Import indítása</Button></Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/50 sticky top-0 z-10">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Állat</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kor / Méret</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Státusz</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Facebook</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Befogadva</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const sp = SPECIES_CONFIG[a.species as Species] ?? SPECIES_CONFIG.other;
                  const hasFb = !!a.fb_post_id;
                  const hasAi = !!a.ai_text_short;
                  return (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/animals/${a.id}`)}
                      className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{sp.emoji}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-foreground">{a.name}</p>
                              {overdueAnimalIds.has(a.id) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                    </TooltipTrigger>
                                    <TooltipContent><p>Lejárt oltás</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            {a.chip_id && <p className="font-mono text-xs text-muted-foreground">{a.chip_id}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{formatAge(a.date_of_birth, a.age_years)}</td>
                      <td className="px-3 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-3 py-3">
                        {hasAi ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {hasFb ? <CheckCircle2 className="h-4 w-4 text-status-adopted" /> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground text-xs">{relativeDate(a.created_at)}</td>
                      <td className="px-3 py-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* New animal modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Új állat hozzáadása</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2"><Label>Név *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="rounded-lg" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Faj</Label>
                <Select value={form.species} onValueChange={v => setForm({ ...form, species: v })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SPECIES_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Nem</Label>
                <Select value={form.sex} onValueChange={v => setForm({ ...form, sex: v })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="male">Kan</SelectItem><SelectItem value="female">Szuka</SelectItem><SelectItem value="unknown">Ismeretlen</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Méret</Label>
                <Select value={form.size} onValueChange={v => setForm({ ...form, size: v })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="small">Kicsi</SelectItem><SelectItem value="medium">Közepes</SelectItem><SelectItem value="large">Nagy</SelectItem><SelectItem value="xlarge">Extra nagy</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Kor (év)</Label><Input type="number" value={form.age_years} onChange={e => setForm({ ...form, age_years: e.target.value })} placeholder="2" className="rounded-lg" /></div>
            </div>
            <div className="space-y-2"><Label>Chip szám</Label><Input value={form.chip_id} onChange={e => setForm({ ...form, chip_id: e.target.value })} placeholder="348..." className="rounded-lg font-mono" /></div>
            <div className="space-y-2"><Label>Fajta tipp</Label><Input value={form.breed_hint} onChange={e => setForm({ ...form, breed_hint: e.target.value })} placeholder="labrador jellegű" className="rounded-lg" /></div>
            <div className="space-y-2"><Label>Megjegyzések</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="rounded-lg" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-lg">Mégse</Button>
              <Button type="submit" disabled={submitting} className="rounded-lg">{submitting ? "Mentés..." : "Mentés"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
