import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, AlertTriangle, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Vaccination = Tables<"animal_vaccinations">;

interface Props {
  animalId: string;
  shelterId: string;
}

export function VaccinationsSection({ animalId, shelterId }: Props) {
  const { toast } = useToast();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    vaccine_name: "",
    administered_date: today,
    next_due_date: "",
    vet_name: "",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from("animal_vaccinations")
      .select("*")
      .eq("animal_id", animalId)
      .order("administered_date", { ascending: false });
    setVaccinations(data ?? []);
    setLoading(false);
  }, [animalId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.vaccine_name || !form.administered_date) return;
    setSaving(true);
    const { error } = await supabase.from("animal_vaccinations").insert({
      animal_id: animalId,
      shelter_id: shelterId,
      vaccine_name: form.vaccine_name,
      administered_date: form.administered_date,
      next_due_date: form.next_due_date || null,
      vet_name: form.vet_name || null,
      notes: form.notes || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Hiba", description: "Mentés sikertelen.", variant: "destructive" });
    } else {
      toast({ title: "Oltás hozzáadva!" });
      setShowForm(false);
      setForm({ vaccine_name: "", administered_date: today, next_due_date: "", vet_name: "", notes: "" });
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("animal_vaccinations").delete().eq("id", deleteId);
    toast({ title: "Oltás törölve." });
    setDeleteId(null);
    fetchData();
  };

  const getStatus = (nextDue: string | null) => {
    if (!nextDue) return null;
    const diff = (new Date(nextDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return "overdue";
    if (diff <= 30) return "soon";
    return null;
  };

  return (
    <Card className="rounded-xl shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Oltások</CardTitle>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1 text-xs rounded-lg">
          <Plus className="h-3 w-3" /> Új oltás
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Betöltés...</p>
        ) : vaccinations.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nincs rögzített oltás</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Oltás neve</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Beadva</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Következő</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Állatorvos</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {vaccinations.map(v => {
                  const status = getStatus(v.next_due_date);
                  return (
                    <tr key={v.id} className={cn("border-b border-border last:border-0", status === "overdue" && "bg-amber-50")}>
                      <td className="px-3 py-2.5 font-medium">{v.vaccine_name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{format(new Date(v.administered_date), "yyyy.MM.dd")}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">{v.next_due_date ? format(new Date(v.next_due_date), "yyyy.MM.dd") : "—"}</span>
                          {status === "overdue" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              <AlertTriangle className="h-3 w-3" /> Lejárt
                            </span>
                          )}
                          {status === "soon" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              <Bell className="h-3 w-3" /> Hamarosan
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{v.vet_name || "—"}</td>
                      <td className="px-3 py-2.5">
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(v.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Inline add form */}
        {showForm && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Oltás neve *</Label>
                <Input value={form.vaccine_name} onChange={e => setForm({ ...form, vaccine_name: e.target.value })} placeholder="pl. Veszettség elleni" className="h-8 rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Beadás dátuma *</Label>
                <VaxDatePicker value={form.administered_date} onChange={v => setForm({ ...form, administered_date: v })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Következő esedékes</Label>
                <VaxDatePicker value={form.next_due_date} onChange={v => setForm({ ...form, next_due_date: v })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Állatorvos neve</Label>
                <Input value={form.vet_name} onChange={e => setForm({ ...form, vet_name: e.target.value })} className="h-8 rounded-lg text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Megjegyzés</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="rounded-lg text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving || !form.vaccine_name} className="rounded-lg">{saving ? "Mentés..." : "Mentés"}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="rounded-lg">Mégse</Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Biztosan törlöd az oltást?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-lg">Mégse</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-lg">Törlés</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function VaxDatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const date = value ? new Date(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("h-8 w-full justify-start text-left text-sm rounded-lg", !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-3 w-3" />
          {date ? format(date, "yyyy.MM.dd") : "Válassz dátumot"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={d => onChange(d ? format(d, "yyyy-MM-dd") : "")} initialFocus className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  );
}
