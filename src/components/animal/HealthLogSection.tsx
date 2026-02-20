import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { HEALTH_CATEGORY_CONFIG, type HealthCategory } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type HealthEntry = Tables<"animal_health_log">;

interface Props {
  animalId: string;
  shelterId: string;
}

export function HealthLogSection({ animalId, shelterId }: Props) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ entry_date: today, category: "general", description: "", vet_name: "" });

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from("animal_health_log")
      .select("*")
      .eq("animal_id", animalId)
      .order("entry_date", { ascending: false });
    setEntries(data ?? []);
    setLoading(false);
  }, [animalId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.description) return;
    setSaving(true);
    const { error } = await supabase.from("animal_health_log").insert({
      animal_id: animalId,
      shelter_id: shelterId,
      entry_date: form.entry_date,
      category: form.category,
      description: form.description,
      vet_name: form.vet_name || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Hiba", description: "Mentés sikertelen.", variant: "destructive" });
    } else {
      toast({ title: "Bejegyzés hozzáadva!" });
      setShowForm(false);
      setForm({ entry_date: today, category: "general", description: "", vet_name: "" });
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("animal_health_log").delete().eq("id", deleteId);
    toast({ title: "Bejegyzés törölve." });
    setDeleteId(null);
    fetchData();
  };

  return (
    <Card className="rounded-xl shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Egészségügyi napló</CardTitle>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1 text-xs rounded-lg">
          <Plus className="h-3 w-3" /> Új bejegyzés
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Betöltés...</p>
        ) : entries.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nincs bejegyzés</p>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => {
              const cat = HEALTH_CATEGORY_CONFIG[entry.category as HealthCategory] ?? HEALTH_CATEGORY_CONFIG.general;
              return (
                <div key={entry.id} className={cn("border-l-4 rounded-r-lg p-3 bg-accent/30 group relative", cat.colorClass)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">{format(new Date(entry.entry_date), "yyyy.MM.dd")}</span>
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", cat.bgClass)}>{cat.label}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{entry.description}</p>
                  {entry.vet_name && <p className="text-xs text-muted-foreground mt-1">Állatorvos: {entry.vet_name}</p>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(entry.id)}
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {showForm && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Dátum *</Label>
                <LogDatePicker value={form.entry_date} onChange={v => setForm({ ...form, entry_date: v })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Kategória *</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-8 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(HEALTH_CATEGORY_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Leírás *</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="rounded-lg text-sm" placeholder="pl. Ivartalanítva. Műtét rendben lezajlott." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Állatorvos neve</Label>
              <Input value={form.vet_name} onChange={e => setForm({ ...form, vet_name: e.target.value })} className="h-8 rounded-lg text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving || !form.description} className="rounded-lg">{saving ? "Mentés..." : "Mentés"}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="rounded-lg">Mégse</Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Biztosan törlöd a bejegyzést?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-lg">Mégse</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-lg">Törlés</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function LogDatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
