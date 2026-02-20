import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Pencil, Save, X } from "lucide-react";
import { INTAKE_METHOD_CONFIG, CHIP_STATUS_CONFIG } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Animal = Tables<"animals">;

interface Props {
  animal: Animal;
  onSaved: () => void;
}

export function IntakeSection({ animal, onSaved }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    intake_date: animal.intake_date || "",
    intake_method: animal.intake_method || "",
    intake_person: animal.intake_person || "",
    intake_condition: animal.intake_condition || "",
    background_estimate: animal.background_estimate || "",
    chip_id: animal.chip_id || "",
    chip_date: animal.chip_date || "",
    chip_vet: animal.chip_vet || "",
    chip_status: animal.chip_status || "unknown",
  });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("animals").update({
      intake_date: form.intake_date || null,
      intake_method: form.intake_method || null,
      intake_person: form.intake_person || null,
      intake_condition: form.intake_condition || null,
      background_estimate: form.background_estimate || null,
      chip_id: form.chip_id || null,
      chip_date: form.chip_date || null,
      chip_vet: form.chip_vet || null,
      chip_status: form.chip_status || "unknown",
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

  const chipStatusConfig = CHIP_STATUS_CONFIG[form.chip_status as keyof typeof CHIP_STATUS_CONFIG] ?? CHIP_STATUS_CONFIG.unknown;

  return (
    <Card className="rounded-xl shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium">Befogadási adatok</CardTitle>
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
      <CardContent className="space-y-4">
        {/* Intake fields */}
        <div className="space-y-3">
          <FieldRow label="Befogadás dátuma">
            {editing ? (
              <DatePicker value={form.intake_date} onChange={v => setForm({ ...form, intake_date: v })} />
            ) : (
              <span className="text-sm">{form.intake_date ? format(new Date(form.intake_date), "yyyy.MM.dd") : "—"}</span>
            )}
          </FieldRow>

          <FieldRow label="Befogadás módja">
            {editing ? (
              <Select value={form.intake_method} onValueChange={v => setForm({ ...form, intake_method: v })}>
                <SelectTrigger className="h-8 rounded-lg text-sm"><SelectValue placeholder="Válassz..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(INTAKE_METHOD_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm">{INTAKE_METHOD_CONFIG[form.intake_method as keyof typeof INTAKE_METHOD_CONFIG]?.label ?? "—"}</span>
            )}
          </FieldRow>

          <FieldRow label="Befogadó személy">
            {editing ? (
              <Input value={form.intake_person} onChange={e => setForm({ ...form, intake_person: e.target.value })} className="h-8 rounded-lg text-sm" />
            ) : (
              <span className="text-sm">{form.intake_person || "—"}</span>
            )}
          </FieldRow>

          <FieldRow label="Állapot">
            {editing ? (
              <Textarea value={form.intake_condition} onChange={e => setForm({ ...form, intake_condition: e.target.value })} rows={2} className="rounded-lg text-sm" />
            ) : (
              <span className="text-sm whitespace-pre-wrap">{form.intake_condition || "—"}</span>
            )}
          </FieldRow>

          <FieldRow label="Becsült előzmény">
            {editing ? (
              <Textarea value={form.background_estimate} onChange={e => setForm({ ...form, background_estimate: e.target.value })} rows={2} className="rounded-lg text-sm" />
            ) : (
              <span className="text-sm whitespace-pre-wrap">{form.background_estimate || "—"}</span>
            )}
          </FieldRow>
        </div>

        {/* Chip section */}
        <hr className="border-border" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chip adatok</p>
        <div className="space-y-3">
          <FieldRow label="Chip szám">
            {editing ? (
              <Input value={form.chip_id} onChange={e => setForm({ ...form, chip_id: e.target.value })} className="h-8 rounded-lg text-sm" />
            ) : (
              <span className="text-sm font-mono">{form.chip_id || "—"}</span>
            )}
          </FieldRow>

          <FieldRow label="Beültetés dátuma">
            {editing ? (
              <DatePicker value={form.chip_date} onChange={v => setForm({ ...form, chip_date: v })} />
            ) : (
              <span className="text-sm">{form.chip_date ? format(new Date(form.chip_date), "yyyy.MM.dd") : "—"}</span>
            )}
          </FieldRow>

          <FieldRow label="Állatorvos">
            {editing ? (
              <Input value={form.chip_vet} onChange={e => setForm({ ...form, chip_vet: e.target.value })} className="h-8 rounded-lg text-sm" />
            ) : (
              <span className="text-sm">{form.chip_vet || "—"}</span>
            )}
          </FieldRow>

          <FieldRow label="Státusz">
            {editing ? (
              <Select value={form.chip_status} onValueChange={v => setForm({ ...form, chip_status: v })}>
                <SelectTrigger className="h-8 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CHIP_STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", chipStatusConfig.colorClass)}>
                {chipStatusConfig.label}
              </span>
            )}
          </FieldRow>
        </div>
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

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
        <Calendar
          mode="single"
          selected={date}
          onSelect={d => onChange(d ? format(d, "yyyy-MM-dd") : "")}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
