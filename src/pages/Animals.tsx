import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { SPECIES_CONFIG, STATUS_CONFIG, formatAge, type AnimalStatus, type Species } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, PawPrint } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Animal = Tables<"animals">;

export default function Animals() {
  const { shelterId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("filter") === "ready" ? "available" : "all");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);

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

  const filtered = animals.filter(a => {
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
        <div className="flex gap-3"><Skeleton className="h-10 w-64" /><Skeleton className="h-10 w-40" /><Skeleton className="h-10 w-36" /></div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Állatok</h1>
          <p className="text-sm text-muted-foreground">{animals.length} állat</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 rounded-lg"><Plus className="h-4 w-4" /> Új állat</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Keresés név, chip, fajta..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs rounded-lg" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Minden státusz</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-36 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Minden faj</SelectItem>
            {Object.entries(SPECIES_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card className="rounded-xl shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PawPrint className="h-12 w-12 text-muted-foreground/30 mb-3" />
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
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Állat</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Faj / Kor</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Státusz</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Facebook</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">AI szöveg</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const sp = SPECIES_CONFIG[a.species as Species] ?? SPECIES_CONFIG.other;
                  const hasFb = !!a.fb_post_id;
                  const fbReady = !!a.ai_text_short && !a.fb_post_id;
                  const hasAi = !!a.ai_text_short;
                  return (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/animals/${a.id}`)}
                      className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{sp.emoji}</span>
                          <div>
                            <p className="font-medium">{a.name}</p>
                            {a.chip_id && <p className="text-xs text-muted-foreground">{a.chip_id}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{sp.label} · {formatAge(a.date_of_birth, a.age_years)}</td>
                      <td className="px-3 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-3 py-3">
                        {hasFb ? <span className="text-status-adopted text-xs font-medium">✓ Kinn van</span>
                          : fbReady ? <span className="text-primary text-xs font-medium">● Kész</span>
                          : <span className="text-muted-foreground text-xs">— Hiányos</span>}
                      </td>
                      <td className="px-3 py-3">
                        {hasAi ? <span className="text-primary text-xs font-medium">✓ Kész</span>
                          : <span className="text-muted-foreground text-xs">— Hiányzik</span>}
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
            <div className="space-y-2"><Label>Chip szám</Label><Input value={form.chip_id} onChange={e => setForm({ ...form, chip_id: e.target.value })} placeholder="348..." className="rounded-lg" /></div>
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
