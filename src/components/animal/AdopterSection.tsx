import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Pencil, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Animal = Tables<"animals">;

interface Props {
  animal: Animal;
  onSaved: () => void;
}

export function AdopterSection({ animal, onSaved }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    adopter_name: animal.adopter_name || "",
    adopter_email: animal.adopter_email || "",
    adopter_phone: animal.adopter_phone || "",
    followup_done: animal.followup_done || false,
    followup_date: animal.followup_date || "",
  });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("animals").update({
      adopter_name: form.adopter_name || null,
      adopter_email: form.adopter_email || null,
      adopter_phone: form.adopter_phone || null,
      followup_done: form.followup_done,
      followup_date: form.followup_date || null,
    }).eq("id", animal.id);
    setSaving(false);
    if (error) {
      toast({ title: "Hiba", description: "Mentés sikertelen.", variant: "destructive" });
    } else {
      toast({ title: "Mentve!" });
      setEditing(false);
      onSaved();
    }
  };

  return (
    <Card className="rounded-xl shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium">Örökbefogadói adatok</CardTitle>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1 text-xs">
            <Pencil className="h-3 w-3" /> Szerkesztés
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="h-3 w-3" /></Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1 text-xs rounded-lg">
              <Save className="h-3 w-3" /> Mentés
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <FieldRow label="Név">
          {editing ? (
            <Input value={form.adopter_name} onChange={e => setForm({ ...form, adopter_name: e.target.value })} className="h-8 rounded-lg text-sm" />
          ) : (
            <span className="text-sm">{form.adopter_name || "—"}</span>
          )}
        </FieldRow>
        <FieldRow label="Email">
          {editing ? (
            <Input type="email" value={form.adopter_email} onChange={e => setForm({ ...form, adopter_email: e.target.value })} className="h-8 rounded-lg text-sm" />
          ) : (
            <span className="text-sm">{form.adopter_email || "—"}</span>
          )}
        </FieldRow>
        <FieldRow label="Telefon">
          {editing ? (
            <Input type="tel" value={form.adopter_phone} onChange={e => setForm({ ...form, adopter_phone: e.target.value })} className="h-8 rounded-lg text-sm" />
          ) : (
            <span className="text-sm">{form.adopter_phone || "—"}</span>
          )}
        </FieldRow>
        <FieldRow label="Örökbefogadva">
          <span className="text-sm">{animal.adopted_at ? format(new Date(animal.adopted_at), "yyyy.MM.dd") : "—"}</span>
        </FieldRow>

        <hr className="border-border" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">30 napos utókövetés</p>

        <div className="flex items-center gap-2">
          {editing ? (
            <Checkbox checked={form.followup_done} onCheckedChange={v => setForm({ ...form, followup_done: !!v })} />
          ) : (
            <Checkbox checked={form.followup_done} disabled />
          )}
          <Label className="text-sm">Visszajelzés megérkezett</Label>
        </div>

        {form.followup_done && (
          <FieldRow label="Visszajelzés dátuma">
            {editing ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-full justify-start text-left text-sm rounded-lg", !form.followup_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {form.followup_date ? format(new Date(form.followup_date), "yyyy.MM.dd") : "Válassz dátumot"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.followup_date ? new Date(form.followup_date) : undefined}
                    onSelect={d => setForm({ ...form, followup_date: d ? format(d, "yyyy-MM-dd") : "" })}
                    initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            ) : (
              <span className="text-sm">{form.followup_date ? format(new Date(form.followup_date), "yyyy.MM.dd") : "—"}</span>
            )}
          </FieldRow>
        )}
      </CardContent>
    </Card>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
      <Label className="text-xs text-muted-foreground shrink-0 sm:w-32 sm:pt-1">{label}</Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
